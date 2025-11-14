/////////////////////////////////////////////////////////////////////
// This module define a middleware that serve static resources
/////////////////////////////////////////////////////////////////////
// Author : Nicolas Chourot
// Lionel-Groulx College
/////////////////////////////////////////////////////////////////////

import path from 'path';
import fs from 'fs';
import mimes from './mimes.js';

global.wwwroot = 'wwwroot';
let defaultResource = 'index.html';

function isDirectory(url) {
    let extension = path.extname(url).replace('.', '');
    return extension == '';
}

function normalizeResourceName(resourceName) {
    return resourceName.replace(/^[/\\]+/, '');
}

function resolveCaseInsensitivePath(resourceName) {
    const segments = resourceName.split(/[/\\]+/).filter(segment => segment.length > 0);
    let currentPath = path.join(process.cwd(), wwwroot);
    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        let candidatePath = path.join(currentPath, segment);
        if (!fs.existsSync(candidatePath)) {
            try {
                const entries = fs.readdirSync(currentPath);
                const match = entries.find(entry => entry.toLowerCase() === segment.toLowerCase());
                if (match) {
                    candidatePath = path.join(currentPath, match);
                }
            } catch {
                return path.join(currentPath, ...segments.slice(i));
            }
        }
        currentPath = candidatePath;
    }
    return currentPath;
}

function requestedStaticResource(url) {
    let isDir = isDirectory(url);
    url += isDir ? (url.slice(-1) != '/' ? '/' : '') : '';
    let resourceName = isDir ? url + defaultResource : url;
    resourceName = normalizeResourceName(resourceName);
    let resourcePath = resolveCaseInsensitivePath(resourceName);
    return resourcePath;
}

function extToContentType(filePath) {
    let extension = path.extname(filePath).replace('.', '');
    let contentType = mimes(extension);
    if (contentType !== undefined)
        return contentType;
    return 'text/html';
}

export function handleStaticResourceRequest(HttpContext) {
    let url;
    // handling static html API help pages 
    if (HttpContext.path.queryString == '?')
        url = "api-help-pages/" + `api-${HttpContext.path.model}-help.html`;
    else
        url = HttpContext.req.url;
    let filePath = requestedStaticResource(url);
    let contentType = extToContentType(filePath);
    try {
        let content = fs.readFileSync(filePath);
        console.log(FgCyan,"Static resource: ", contentType, filePath);
        return HttpContext.response.content(contentType, content);
    } catch (error) {
        if (error.code === 'ENOENT')
            return false;
        else
            return HttpContext.response.internalError(`Server error: ${error.code}`);
    }
    
}
