/* 思源 API */

export {
    request,
    getConf,
    getNotebookConf,
    getFullHPathByID,
    queryBlock,
    querySameBlocks,
    queryAsset,
    updateBlock,
    getBlockIndex,
    getBlockKramdown,
    exportMdContent,
    getDocHistoryContent,
    getBlockDomByID,
    getDoc,
    getAsset,
    getLocalFile,
    getFile,
    putFile,
    resolveAssetPath,
    upload,
    getBlockAttrs,
    setBlockAttrs,
};

import { config } from './config.js';

async function request(url, data, token = config.token) {
    return fetch(url, {
        body: JSON.stringify(data),
        method: 'POST',
        headers: {
            Authorization: `Token ${token}`,
        }
    }).then(r => {
        if (r.status === 200)
            return r.json();
        else return null;
    });
}

async function getConf() {
    return request('/api/system/getConf', {});
}

async function getNotebookConf(notebook) {
    return request('/api/notebook/getNotebookConf', {
        notebook: notebook,
    });
}

async function getFullHPathByID(id) {
    return request('/api/filetree/getFullHPathByID', {
        id,
    });
}

async function queryBlock(id) {
    return request('/api/query/sql', {
        stmt: `SELECT * FROM blocks WHERE id = '${id}'`,
    });
}

/* 查询当前文档下所有同类型的块(通过属性/字段) */
async function querySameBlocks(id, value = null, name = config.pseudocode.attrs.index) {
    return request('/api/query/sql', {
        stmt: value
            ? `SELECT B0.id FROM blocks AS B0 WHERE B0.id IN ( SELECT A.block_id FROM attributes AS A WHERE A.name = '${name}' AND A.value = '${value}' ) AND B0.root_id IN ( SELECT B1.root_id FROM blocks AS B1 WHERE B1.id = '${id}' );`
            : `SELECT B0.id FROM blocks AS B0 WHERE B0.id IN ( SELECT A.block_id FROM attributes AS A WHERE A.name = '${name}') AND B0.root_id IN ( SELECT B1.root_id FROM blocks AS B1 WHERE B1.id = '${id}' );`,
    });
}

async function queryAsset(path) {
    return request('/api/query/sql', {
        stmt: `SELECT * FROM assets WHERE path = '${path}' ORDER BY id`,
    });
}

async function updateBlock(id, data, dataType = 'markdown') {
    return request('/api/block/updateBlock', {
        id,
        data,
        dataType,
    });
}

async function getBlockIndex(id) {
    return request('/api/block/getBlockIndex', {
        id,
    });
}

async function getBlockKramdown(id) {
    return request('/api/block/getBlockKramdown', {
        id,
    });
}

async function exportMdContent(id) {
    return request('/api/export/exportMdContent', {
        id,
    });
}

async function getDocHistoryContent(historyPath, k = "") {
    return request('/api/history/getDocHistoryContent', {
        historyPath,
        k,
    });
}

async function getBlockDomByID(id, headingMode = 0, excludeIDs = []) {
    return request('/api/search/searchEmbedBlock', {
        stmt: `SELECT * FROM blocks WHERE id = '${id}' LIMIT 1;`,
        headingMode,
        excludeIDs,
    });
}

async function getDoc(id, mode = 0, size = 2147483647) {
    return request('/api/filetree/getDoc', {
        id,
        mode,
        size,
    });
}

async function getFile(path, token = config.token) {
    const response = await fetch(
        '/api/file/getFile', {
        method: "POST",
        headers: {
            Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
            path,
        }),
    });
    if (response.status === 200)
        return response;
    else return null;
}

async function getLocalFile(path) {
    const response = await fetch(
        path.startsWith('file://') ? path : `file://${path}`,
        {
            method: "GET",
        });
    if (response.status === 200)
        return response;
    else return null;
}

async function getAsset(path, token = config.token) {
    const response = await fetch(
        path.startsWith('/') ? path : `/${path}`,
        {
            method: "GET",
            headers: {
                Authorization: `Token ${token}`,
            },
        });
    if (response.status === 200)
        return response;
    else return null;
}

async function putFile(path, filedata, isDir = false, modTime = Date.now(), token = config.token) {
    let blob = new Blob([filedata]);
    let file = new File([blob], path.split('/').pop());
    let formdata = new FormData();
    formdata.append("path", path);
    formdata.append("file", file);
    formdata.append("isDir", isDir);
    formdata.append("modTime", modTime);
    const response = await fetch(
        "/api/file/putFile",
        {
            body: formdata,
            method: "POST",
            headers: {
                Authorization: `Token ${token}`,
            },
        });
    if (response.status === 200)
        return await response.json();
    else return null;
}

async function resolveAssetPath(path) {
    return request('/api/asset/resolveAssetPath', {
        path: path,
    });
}

async function upload(filename, filedata, path = '/assets/', mine = null, token = config.token) {
    filename = filenameParse(filename).name;

    let blob = new Blob([filedata], { type: mime });
    let file = new File([blob], filename, { lastModified: Date.now() });
    let formdata = new FormData();
    formdata.append("assetsDirPath", path);
    formdata.append("file[]", file);
    const response = await fetch(
        "/api/asset/upload",
        {
            body: formdata,
            method: "POST",
            headers: {
                Authorization: `Token ${token}`,
            },
        });
    if (response.status === 200)
        return await response.json();
    else return null;
}

async function getBlockAttrs(id) {
    return request('/api/attr/getBlockAttrs', {
        id,
    });
}

async function setBlockAttrs(id, attrs) {
    return request('/api/attr/setBlockAttrs', {
        id,
        attrs,
    });
}
