# --- Configuration ---
$sourceDir = "build"
$destDir = "dist"

# --- Main Script ---
Write-Host "🧹 Cleaning up old '$destDir' directory..."
if (Test-Path $destDir) {
    Remove-Item -Recurse -Force $destDir
}

$fullSourcePath = (Get-Item -Path $sourceDir).FullName

Get-ChildItem -Path $sourceDir -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Substring($fullSourcePath.Length)
    $destFile = Join-Path -Path $destDir -ChildPath $relativePath

    New-Item -ItemType Directory -Force (Split-Path $destFile) | Out-Null

    if ($_.Extension -eq ".js") {
        Write-Host "Attempting to minify: $($_.FullName)"
        # --- MODIFIED PART ---
        # Run terser and then immediately check its exit code
        terser $_.FullName -o $destFile --compress --mangle --ecma 2020
        
        if ($LASTEXITCODE -ne 0) {
            # This runs if the last command failed
            Write-Warning "Terser failed. Copying original file instead."
            Copy-Item $_.FullName -Destination $destFile -Force
        }
    }
    else {
        # For non-JS files, just copy them
        Write-Host "Copying:   $($_.FullName)"
        Copy-Item $_.FullName -Destination $destFile
    }
}

# The addon (doq.html etc.) is not part of the gulp build but ships with the
# viewer (baws-search/public/pdfjs links to dist/generic), so copy it as-is.
if (Test-Path "addon") {
    Write-Host "Copying addon -> $destDir\generic\addon"
    Copy-Item -Recurse -Force "addon" (Join-Path $destDir "generic\addon")
}

Write-Host "✅ Done! Minified site is in '$destDir'."