<?php

// MediaSpace fetches this shell cross-origin and writes it into a friendly iframe (see src/dev/analyticsLoaderFriendly.html).
// The response is public and requested without credentials, so the wildcard origin exposes nothing private.
header("Access-Control-Allow-Origin: *");
// The base href depends on the request host, so shared caches must never serve one host's response to another.
header("Cache-Control: no-store, private");
header("Vary: Host");

$host = $_SERVER['SERVER_NAME'];
if (!preg_match('/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i', $host)) {
    http_response_code(400);
    exit;
}

$content = file_get_contents('index.html');
$scheme = (isset($_SERVER['HTTPS']) && strtolower($_SERVER['HTTPS']) == 'on')? 'https': 'http';
$baseHref = $scheme.'://' . $host . $_SERVER['SCRIPT_NAME'];
$pos = strrpos($baseHref, '/');
$baseHref = substr($baseHref, 0, $pos+1); //.'index.html';
$content = str_replace('<head>', '<head><base href="'.htmlspecialchars($baseHref, ENT_QUOTES, 'UTF-8').'" />', $content);
$content = str_replace('</head>', '<script>window["loadInFriendlyIframe"]=true;</script></head>', $content);

echo $content;
