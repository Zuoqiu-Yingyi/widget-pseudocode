import { config } from "./config.js";
import { merge } from "./utils.js";
import {
    getConf,
    getBlockAttrs,
    setBlockAttrs,
} from "./api.js";

import render from "./pseudocode/pseudocode.js";

function registerCompletionItemProvider(language) {
    window.pseudocode.IDisposable?.dispose();
    switch (language) {
        case 'markdown':
            window.pseudocode.IDisposable = monaco.languages.registerCompletionItemProvider(
                language,
                new window.pseudocode.completion.MdCompletionItemProvider(),
            );
            break;
    }
}

window.onload = async () => {
    // console.log('onload');
    try {
        window.pseudocode = {
            render: render,
            height: parseInt(window.frameElement?.style?.height) || 256, // 窗口高度
            changed: false, // 是否发生更改
            code: null, // 代码
            html: null, // 渲染后的 DOM

            url: new URL(window.location.href),
            index: document.getElementById('index'),
            picker: document.getElementById('picker'),
            switch: document.getElementById('switch'),
            element: document.getElementById('pseudocode'),
            breadcrumb: {
                element: document.getElementById('breadcrumb'),
                status: document.getElementById('status'),
                type: document.getElementById('type'),
                crumb: document.getElementById('crumb'),
                set: (typeText, hpathText, typeTitle, hpathTitle, blockHref, docHref) => {
                    if (typeText) {
                        typeText = typeText.replaceAll(/(\n|\r)+/g, ' ')
                        window.pseudocode.params.breadcrumb.type.innerText = typeText;
                        window.pseudocode.params.breadcrumb.typeText = typeText;
                    }
                    if (hpathText) window.pseudocode.params.breadcrumb.crumb.innerText = hpathText.replaceAll(/(\n|\r)+/g, ' ');

                    if (typeTitle) window.pseudocode.params.breadcrumb.type.setAttribute('title', typeTitle);
                    if (hpathTitle) window.pseudocode.params.breadcrumb.crumb.setAttribute('title', hpathTitle);

                    if (blockHref) window.pseudocode.params.breadcrumb.type.href = blockHref;
                    if (docHref) window.pseudocode.params.breadcrumb.crumb.href = docHref;
                },
            },
            editor: {
                editor: null,
                element: document.getElementById('editor'),
            },
        };
        getConf().then(async conf => {
            window.pseudocode.params = {
                id: window.pseudocode.url.searchParams.get('id')
                    || window.frameElement.parentElement.parentElement.dataset.nodeId, // 块 ID
                mode: window.pseudocode.url.searchParams.get('mode')
                    || 'none', // 编辑器模式
                theme: parseInt(window.pseudocode.url.searchParams.get('theme'))
                    || conf?.data?.conf?.appearance?.mode
                    || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 1 : 0), // 主题模式
                lang: window.pseudocode.url.searchParams.get('lang')
                    || conf?.data?.conf?.lang
                    || 'default', // 语言
                language: window.pseudocode.url.searchParams.get('language')
                    || 'markdown', // 语言模式
                tabSize: parseInt(window.pseudocode.url.searchParams.get('tabSize'))
                    ?? conf?.data?.conf?.editor?.codeTabSpaces
                    ?? 4, // 缩进空格数量
                fontFamily: decodeURI(window.pseudocode.url.searchParams.get('fontFamily') ?? '')
                    ? [decodeURI(window.pseudocode.url.searchParams.get('fontFamily') ?? '')]
                    : [], // 字体
                katexMacros: JSON.parse(conf?.data?.conf?.editor?.katexMacros)
                    || {},
                IStandaloneEditorConstructionOptions: {}, // 编辑器配置
                // REF [JS Unicode编码和解码（6种方法）](http://c.biancheng.net/view/5602.html)
                body: JSON.parse(
                    decodeURI(
                        window.pseudocode.url.hash.length > 0
                            ? window.pseudocode.url.hash.substring(1)
                            : ''
                    ) || null
                ),
            };

            /* 导入数据 */
            var attributes = await getBlockAttrs(window.pseudocode.params.id);
            if (attributes) {
                attributes = attributes.data ?? {};
                // window.pseudocode.code = attributes['custom-md'] ?? "";
                const lines = attributes[config.pseudocode.attrs.markdown]?.split('\n');
                const index = attributes[config.pseudocode.attrs.index] ?? 1;
                if (lines && lines.length >= 2) {
                    lines.shift();
                    lines.pop();
                    window.pseudocode.code = lines.join('\n');
                }

                window.pseudocode.index.value = index;
            }

            // REF [Monaco Editor 入门指南 - 知乎](https://zhuanlan.zhihu.com/p/88828576)
            // require.config({
            //     paths: {
            //         // vs: '/widgets/pseudocode/static/vs'
            //         vs: './static/vs'
            //     },
            // });
            require.config({
                paths: {
                    // vs: '/widgets/pseudocode/static/vs'
                    vs: './static/vs',
                },
                'vs/nls': {
                    availableLanguages: {
                        '*': config.pseudocode.MAP.LANGS[window.pseudocode.params.lang]
                            || config.pseudocode.MAP.LANGS.default
                            || '',
                    },
                },
            });
            require([
                'vs/editor/editor.main',
            ], async () => {
                /* 切换为预览模式 */
                function preview() {
                    window.pseudocode.code = window.pseudocode.editor.editor.getValue();
                    // console.log(window.pseudocode.render);
                    window.pseudocode.html = window.pseudocode.render.renderToString(
                        window.pseudocode.code,
                        merge(
                            {},
                            config.pseudocode.PseudocodeRenderOptions,
                            {
                                captionCount: window.pseudocode.index.value - 1,
                            },
                        ),
                    );
                    window.pseudocode.element.innerHTML = window.pseudocode.html;

                    /* 保存至块属性 */
                    if (window.pseudocode.changed) {
                        // attributes['custom-md'] = window.pseudocode.code;
                        attributes[config.pseudocode.attrs.markdown] = `\`\`\`pseudocode\n${window.pseudocode.code}\n\`\`\``;
                        attributes[config.pseudocode.attrs.index] = window.pseudocode.index.value;
                        // attributes[config.pseudocode.attrs.html] = window.pseudocode.html;
                        setBlockAttrs(window.pseudocode.params.id, attributes).then(response => {
                            if (response?.code === 0) { // 保存成功
                                window.pseudocode.changed = false;
                                window.pseudocode.breadcrumb.status.innerText = config.pseudocode.mark.status.success; // 保存成功
                            }
                        });
                    }

                    /* 显示渲染结果 */
                    window.pseudocode.editor.element.style.display = 'none';
                    window.pseudocode.element.style.display = 'block';

                    /* 根据渲染结果调整挂件块高度 */
                    setTimeout(() => {
                        const content = window.pseudocode.element?.firstElementChild?.firstElementChild;
                        if (content) {
                            window.pseudocode.height = Math.ceil(
                                window.pseudocode.breadcrumb.element.offsetHeight
                                + content.offsetHeight
                                + content.getBoundingClientRect().top
                            );
                        }
                        console.log(window.pseudocode.height);
                        if (window.frameElement?.style)
                            window.frameElement.style.height = `${window.pseudocode.height}px`;
                    }, 0);
                }

                /* 切换为编辑 */
                function edit() {
                    window.pseudocode.element.style.display = 'none';
                    window.pseudocode.editor.element.style.display = 'block';
                }

                /* 应用当前模式 */
                function mode() {
                    const status = window.pseudocode.switch.checked;
                    // console.log(status);
                    if (status) preview();
                    else edit();
                }

                window.pseudocode.completion = await import('./completion.js');

                const language = window.pseudocode.params.language
                    || 'markdown';
                window.pseudocode.picker.value = language;

                // 编辑器配置
                const options = {};
                merge(
                    options,
                    config.pseudocode.IStandaloneEditorConstructionOptions, // 默认配置
                    {
                        theme: config.pseudocode.MAP.THEMES[window.pseudocode.params.theme]
                            || config.pseudocode.MAP.THEMES.default
                            || 'vs', // 主题
                        tabSize: window.pseudocode.params.tabSize || 4, // 缩进
                    }, // URL params 配置
                    window.pseudocode.params.body
                        ? window.pseudocode.params.body.IStandaloneEditorConstructionOptions || {}
                        : {}, // URL hash 配置
                    {
                        language: language, // 语言模式
                        value: window.pseudocode.code, // 初始值
                    },
                );
                window.pseudocode.editor.editor = monaco.editor.create(
                    window.pseudocode.editor.element,
                    options,
                );
                // console.log(options);

                /* 设置 markdown 文件的自动补全 */
                registerCompletionItemProvider(language);

                /**
                 * 文件是否发生更改
                 * REF [onDidChangeModelContent](https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.IStandaloneCodeEditor.html#onDidChangeModelContent)
                 */
                window.pseudocode.editor.editor.onDidChangeModelContent(() => {
                    if (window.pseudocode.changed) return; // 之前已经发生更改
                    else {
                        // 之前没有发生更改
                        window.pseudocode.changed = true;
                        window.pseudocode.breadcrumb.status.innerText = config.pseudocode.mark.status.edited;
                    }
                });

                /* 更改语言标签 */
                window.pseudocode.picker.onchange = () => {
                    monaco.editor.setModelLanguage(window.pseudocode.editor.editor.getModel(), window.pseudocode.picker.value);
                    registerCompletionItemProvider(window.pseudocode.picker.value);
                };

                /* 更改序号 */
                window.pseudocode.index.onchange = () => {
                    attributes[config.pseudocode.attrs.index] = window.pseudocode.index.value;
                    setBlockAttrs(window.pseudocode.params.id, attributes);
                };

                /* 👇👇 右键菜单项 👇👇 */
                // REF [IActionDescriptor | Monaco Editor API](https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.IActionDescriptor.html)
                /* 👆👆 右键菜单项 👆👆 */


                /* 切换预览模式 */
                window.pseudocode.switch.onchange = mode;
                setTimeout(mode, 0);

                /* 加载成功 */
                window.pseudocode.breadcrumb.status.innerText = config.pseudocode.mark.status.success; // 加载完成
            });
        }).catch(err => { throw err });
    }
    catch (error) {
        console.error(error);
        document.getElementById('status').innerText = config.pseudocode.mark.status.error;
    }
};
