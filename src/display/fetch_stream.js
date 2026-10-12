/* Copyright 2012 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { assert, PromiseCapability, warn } from "../shared/util.js";
import {
  createResponseStatusError,
  extractFilenameFromHeader,
  validateRangeRequestCapabilities,
  validateResponseStatus,
} from "./network_utils.js";

if (typeof PDFJSDev !== "undefined" && PDFJSDev.test("MOZCENTRAL")) {
  throw new Error(
    'Module "./fetch_stream.js" shall not be used with MOZCENTRAL builds.'
  );
}

function createFetchOptions(
  headers,
  withCredentials,
  abortController,
  { method = "GET", cache = "default" } = {}
) {
  return {
    method,
    headers,
    signal: abortController.signal,
    mode: "cors",
    credentials: withCredentials ? "include" : "same-origin",
    redirect: "follow",
    cache,
  };
}

function createHeaders(httpHeaders) {
  const headers = new Headers();
  for (const property in httpHeaders) {
    const value = httpHeaders[property];
    if (value === undefined) {
      continue;
    }
    headers.append(property, value);
  }
  return headers;
}

function getArrayBuffer(val) {
  if (val instanceof Uint8Array) {
    return val.buffer;
  }
  if (val instanceof ArrayBuffer) {
    return val;
  }
  warn(`getArrayBuffer - unexpected data format: ${val}`);
  return new Uint8Array(val).buffer;
}

/**
 * Persistent cache of PDF byte ranges (Cache Storage API).
 *
 * Every entry is tied to the file's version (its ETag, or Last-Modified when
 * there is no ETag), so a PDF that is replaced on the server is downloaded
 * again and the old version's chunks are deleted. Keys use the file's address
 * without its query string, so signed or tokenized links still hit the cache.
 *
 *   chunk:  <origin+path>?__v=<version>&__chunk=<begin>-<end>
 *   meta:   <origin+path>?__meta=1   -> { version, length, filename }
 */
const ChunkCache = {
  NAME: "chunkCache",
  // Total size kept across all books, and at most a quarter of the space the
  // browser allows this site; the oldest entries are evicted first.
  MAX_BYTES: 500 * 1024 * 1024,
  MAX_SHARE_OF_QUOTA: 0.25,
  // Delay before cleanup so it doesn't compete with loading the first pages.
  MAINTENANCE_DELAY: 10000,

  _cachePromise: null,
  _maintenanceTimer: null,

  /** @returns {Promise<Cache|null>} null when Cache Storage is unavailable. */
  open() {
    if (!this._cachePromise) {
      this._cachePromise = (async () => {
        try {
          // Not available on insecure (http://) pages or in some private modes.
          if (!globalThis.caches) {
            return null;
          }
          const cache = await globalThis.caches.open(this.NAME);
          this._askToKeep();
          return cache;
        } catch (ex) {
          warn(`ChunkCache: unable to open the cache: ${ex}`);
          return null;
        }
      })();
    }
    return this._cachePromise;
  },

  /**
   * Asks the browser to keep this site's storage when the device runs low on
   * space (persistent storage). Chrome decides without asking the user;
   * Firefox would show a prompt, so it isn't asked there.
   */
  _askToKeep() {
    const storage = globalThis.navigator?.storage;
    if (!storage?.persist || /Firefox\//.test(navigator.userAgent)) {
      return;
    }
    storage
      .persisted()
      .then(persisted => persisted || storage.persist())
      .catch(() => {});
  },

  /** MAX_BYTES, or less when the browser allows this site little space. */
  async _limit() {
    try {
      const { quota } = await globalThis.navigator.storage.estimate();
      if (quota > 0) {
        return Math.min(this.MAX_BYTES, quota * this.MAX_SHARE_OF_QUOTA);
      }
    } catch {}
    return this.MAX_BYTES;
  },

  docKey(url) {
    try {
      const { origin, pathname } = new URL(url, globalThis.location?.href);
      return origin + pathname;
    } catch {
      return null;
    }
  },

  /** The file's version from response headers, or null if there is none. */
  versionOf(headers) {
    const etag = headers.get("ETag");
    if (etag) {
      return etag;
    }
    const lastModified = headers.get("Last-Modified");
    return lastModified ? `lm:${lastModified}` : null;
  },

  chunkKey(docKey, version, begin, end) {
    const params = new URLSearchParams({
      __v: version,
      __chunk: `${begin}-${end}`,
    });
    return `${docKey}?${params}`;
  },

  metaKey(docKey) {
    return `${docKey}?__meta=1`;
  },

  async match(cache, key) {
    try {
      const response = await cache.match(key, { ignoreVary: true });
      return response?.ok ? response : null;
    } catch (ex) {
      warn(`ChunkCache: lookup failed: ${ex}`);
      return null;
    }
  },

  /**
   * Stores a copy of a range response as an ordinary 200 response (the Cache
   * API refuses to store 206 responses). Failures, e.g. a full quota, only
   * mean the chunk isn't cached.
   */
  putChunk(cache, key, response) {
    const copy = new Response(response.clone().body, {
      status: 200,
      statusText: "OK",
      headers: response.headers,
    });
    cache.put(key, copy).catch(ex => {
      warn(`ChunkCache: unable to store a chunk: ${ex}`);
    });
  },

  async readMeta(cache, docKey) {
    const response = await this.match(cache, this.metaKey(docKey));
    if (!response) {
      return null;
    }
    try {
      return await response.json();
    } catch {
      return null;
    }
  },

  writeMeta(cache, docKey, meta) {
    const response = new Response(JSON.stringify(meta), {
      headers: { "Content-Type": "application/json" },
    });
    cache.put(this.metaKey(docKey), response).catch(ex => {
      warn(`ChunkCache: unable to store metadata: ${ex}`);
    });
  },

  /**
   * Deletes chunks of other versions of this file and keeps the cache under
   * its limit by evicting the oldest entries (insertion order).
   */
  scheduleMaintenance(cache, docKey, version) {
    clearTimeout(this._maintenanceTimer);
    this._maintenanceTimer = setTimeout(() => {
      this._maintain(cache, docKey, version).catch(ex => {
        warn(`ChunkCache: maintenance failed: ${ex}`);
      });
    }, this.MAINTENANCE_DELAY);
  },

  async _maintain(cache, docKey, version) {
    const keys = await cache.keys();
    const entries = [];
    for (const request of keys) {
      let url;
      try {
        url = new URL(request.url);
      } catch {
        continue;
      }
      const isCurrentDoc = url.origin + url.pathname === docKey;
      const entryVersion = url.searchParams.get("__v");

      // A chunk from another version of the file that is open: never valid.
      if (isCurrentDoc && entryVersion !== null && entryVersion !== version) {
        await cache.delete(request);
        continue;
      }
      const response = await cache.match(request);
      const size = parseInt(response?.headers.get("Content-Length"), 10) || 0;
      entries.push({ request, size, isCurrentDoc });
    }

    const limit = await this._limit();
    let total = entries.reduce((sum, e) => sum + e.size, 0);
    // Evict other books first (oldest first), then this one if still needed.
    for (const pass of [false, true]) {
      for (const entry of entries) {
        if (total <= limit) {
          return;
        }
        if (entry.isCurrentDoc === pass && entry.size > 0) {
          await cache.delete(entry.request);
          total -= entry.size;
        }
      }
    }
  },
};

/** @implements {IPDFStream} */
class PDFFetchStream {
  constructor(source) {
    this.source = source;
    this.isHttp = /^https?:/i.test(source.url);
    this.httpHeaders = (this.isHttp && source.httpHeaders) || {};

    this._fullRequestReader = null;
    this._rangeRequestReaders = [];
  }

  get _progressiveDataLength() {
    return this._fullRequestReader?._loaded ?? 0;
  }

  getFullReader() {
    assert(
      !this._fullRequestReader,
      "PDFFetchStream.getFullReader can only be called once."
    );
    this._fullRequestReader = new PDFFetchStreamReader(this);
    return this._fullRequestReader;
  }

  getRangeReader(begin, end) {
    // Returning null makes the worker wait for the data to arrive via the
    // full reader instead, both for data already read and for the first
    // chunk that the full reader is still delivering.
    if (
      end <= this._progressiveDataLength ||
      end <= (this._fullRequestReader?._pendingProgressiveEnd ?? 0)
    ) {
      return null;
    }
    const reader = new PDFFetchStreamRangeReader(this, begin, end);
    this._rangeRequestReaders.push(reader);
    return reader;
  }

  cancelAllRequests(reason) {
    this._fullRequestReader?.cancel(reason);

    for (const reader of this._rangeRequestReaders.slice(0)) {
      reader.cancel(reason);
    }
  }
}

/**
 * Reads the start of the file. With range requests enabled this asks for
 * exactly the first chunk (so it completes chunk 0 and nothing is fetched
 * twice) and learns the file's size and version from the response headers.
 * When the first chunk of the same version is cached, a HEAD request confirms
 * the version and the chunk is served from the cache instead.
 *
 * @implements {IPDFStreamReader}
 */
class PDFFetchStreamReader {
  constructor(stream) {
    this._stream = stream;
    this._reader = null;
    this._loaded = 0;
    this._filename = null;
    const source = stream.source;
    this._withCredentials = source.withCredentials || false;
    this._contentLength = source.length;
    this._headersCapability = new PromiseCapability();
    this._disableRange = source.disableRange || false;
    this._rangeChunkSize = source.rangeChunkSize;
    if (!this._rangeChunkSize && !this._disableRange) {
      this._disableRange = true;
    }

    this._abortController = new AbortController();
    this._isStreamingSupported = !source.disableStream;
    this._isRangeSupported = !source.disableRange;

    // The file version and cache key, used by the range readers.
    this._version = null;
    // Bytes [0, _pendingProgressiveEnd) will be delivered by this reader.
    this._pendingProgressiveEnd = 0;
    this._docKey = stream.isHttp ? ChunkCache.docKey(source.url) : null;

    this._open().catch(this._headersCapability.reject);

    this.onProgress = null;
  }

  async _open() {
    const url = this._stream.source.url;
    const useCache = !this._disableRange && !!this._docKey;
    const cache = useCache ? await ChunkCache.open() : null;

    if (cache && (await this._openFromCache(cache, url))) {
      return;
    }

    const headers = createHeaders(this._stream.httpHeaders);
    if (!this._disableRange) {
      headers.append("Range", `bytes=0-${this._rangeChunkSize - 1}`);
    }
    const response = await fetch(
      url,
      createFetchOptions(
        headers,
        this._withCredentials,
        this._abortController,
        {
          // We cache chunks ourselves; skip the HTTP cache so the version
          // (ETag) in the response is always current.
          cache: cache ? "no-store" : "default",
        }
      )
    );
    if (!validateResponseStatus(response.status)) {
      throw createResponseStatusError(response.status, url);
    }
    this._version = ChunkCache.versionOf(response.headers);
    const firstChunk = /bytes 0-(\d+)\//.exec(
      response.headers.get("Content-Range") || ""
    );
    if (response.status === 206 && firstChunk) {
      this._pendingProgressiveEnd = parseInt(firstChunk[1], 10) + 1;
    }
    const cacheFirstChunk =
      cache && this._version && response.status === 206 && firstChunk;
    if (cacheFirstChunk) {
      // Copy the body for the cache before it is locked by the reader below.
      ChunkCache.putChunk(
        cache,
        ChunkCache.chunkKey(this._docKey, this._version, 0, firstChunk[1]),
        response
      );
    }
    this._reader = response.body.getReader();

    const getResponseHeader = name => response.headers.get(name);
    const { allowRangeRequests, suggestedLength } =
      validateRangeRequestCapabilities({
        getResponseHeader,
        isHttp: this._stream.isHttp,
        rangeChunkSize: this._rangeChunkSize,
        disableRange: this._disableRange,
      });

    // A 206 means the server only sent the first chunk, so the rest must be
    // fetched with range requests even for small files (which
    // validateRangeRequestCapabilities would otherwise read in one go).
    this._isRangeSupported = allowRangeRequests || response.status === 206;
    // Setting right content length.
    this._contentLength = suggestedLength || this._contentLength;

    this._filename = extractFilenameFromHeader(getResponseHeader);

    if (cacheFirstChunk) {
      ChunkCache.writeMeta(cache, this._docKey, {
        version: this._version,
        length: this._contentLength,
        filename: this._filename,
      });
      ChunkCache.scheduleMaintenance(cache, this._docKey, this._version);
    }
    this._headersCapability.resolve();
  }

  /**
   * @returns {Promise<boolean>} true when the first chunk is served from the
   *   cache after confirming, with a HEAD request, that the file is unchanged.
   */
  async _openFromCache(cache, url) {
    const meta = await ChunkCache.readMeta(cache, this._docKey);
    if (!meta?.version || !meta.length) {
      return false;
    }
    const firstChunkEnd = Math.min(this._rangeChunkSize, meta.length) - 1;
    const cached = await ChunkCache.match(
      cache,
      ChunkCache.chunkKey(this._docKey, meta.version, 0, firstChunkEnd)
    );
    if (!cached) {
      return false;
    }

    let head;
    try {
      head = await fetch(
        url,
        createFetchOptions(
          createHeaders(this._stream.httpHeaders),
          this._withCredentials,
          this._abortController,
          { method: "HEAD", cache: "no-store" }
        )
      );
    } catch (ex) {
      if (ex?.name === "AbortError") {
        throw ex;
      }
      // Offline or the server is unreachable: fall back to the network path,
      // which reports the error the usual way.
      return false;
    }
    if (!head.ok || ChunkCache.versionOf(head.headers) !== meta.version) {
      return false; // The file changed (or HEAD isn't supported).
    }

    this._version = meta.version;
    this._contentLength = meta.length;
    this._filename = meta.filename || null;
    this._isRangeSupported = meta.length > firstChunkEnd + 1;
    this._pendingProgressiveEnd = firstChunkEnd + 1;
    this._reader = cached.body.getReader();
    this._headersCapability.resolve();
    ChunkCache.scheduleMaintenance(cache, this._docKey, this._version);
    return true;
  }

  get headersReady() {
    return this._headersCapability.promise;
  }

  get filename() {
    return this._filename;
  }

  get contentLength() {
    return this._contentLength;
  }

  get isRangeSupported() {
    return this._isRangeSupported;
  }

  get isStreamingSupported() {
    return this._isStreamingSupported;
  }

  async read() {
    await this._headersCapability.promise;
    const { value, done } = await this._reader.read();
    if (done) {
      return { value, done };
    }
    this._loaded += value.byteLength;
    this.onProgress?.({
      loaded: this._loaded,
      total: this._contentLength,
    });

    return { value: getArrayBuffer(value), done: false };
  }

  cancel(reason) {
    this._reader?.cancel(reason);
    this._abortController.abort();
  }
}

/**
 * Reads one byte range, from the chunk cache when this version of the file
 * has it, otherwise from the network (caching the response).
 *
 * @implements {IPDFStreamRangeReader}
 */
class PDFFetchStreamRangeReader {
  constructor(stream, begin, end) {
    this._stream = stream;
    this._reader = null;
    this._loaded = 0;
    this._cancelled = false;
    const source = stream.source;
    this._withCredentials = source.withCredentials || false;
    this._readCapability = new PromiseCapability();
    this._isStreamingSupported = !source.disableStream;

    this._abortController = new AbortController();
    this._headers = createHeaders(this._stream.httpHeaders);
    this._headers.append("Range", `bytes=${begin}-${end - 1}`);

    this._open(begin, end).catch(this._readCapability.reject);

    this.onProgress = null;
  }

  async _open(begin, end) {
    const url = this._stream.source.url;
    const fullReader = this._stream._fullRequestReader;
    // Range readers are only created after the headers are in, so the
    // version is known (it is null when the server sends no ETag).
    const version = fullReader?._version;
    const docKey = fullReader?._docKey;
    const cache = version && docKey ? await ChunkCache.open() : null;
    const key = cache
      ? ChunkCache.chunkKey(docKey, version, begin, end - 1)
      : null;

    if (cache) {
      const cached = await ChunkCache.match(cache, key);
      if (cached) {
        this._setReader(cached.body.getReader());
        return;
      }
    }

    const response = await fetch(
      url,
      createFetchOptions(
        this._headers,
        this._withCredentials,
        this._abortController,
        { cache: cache ? "no-store" : "default" }
      )
    );
    if (!validateResponseStatus(response.status)) {
      throw createResponseStatusError(response.status, url);
    }
    // Never mix bytes from two versions of the file into one document.
    const responseVersion = ChunkCache.versionOf(response.headers);
    if (version && responseVersion && responseVersion !== version) {
      throw new Error(
        "The PDF file changed on the server while it was being read; " +
          "please reload the page."
      );
    }
    if (cache && response.status === 206) {
      ChunkCache.putChunk(cache, key, response);
    }
    this._setReader(response.body.getReader());
  }

  _setReader(reader) {
    this._reader = reader;
    if (this._cancelled) {
      reader.cancel();
    }
    this._readCapability.resolve();
  }

  get isStreamingSupported() {
    return this._isStreamingSupported;
  }

  async read() {
    await this._readCapability.promise;
    const { value, done } = await this._reader.read();
    if (done) {
      return { value, done };
    }
    this._loaded += value.byteLength;
    this.onProgress?.({ loaded: this._loaded });

    return { value: getArrayBuffer(value), done: false };
  }

  cancel(reason) {
    this._cancelled = true;
    this._reader?.cancel(reason);
    this._abortController.abort();
  }
}

export { PDFFetchStream };
