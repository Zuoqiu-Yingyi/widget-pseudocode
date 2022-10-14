import {
    config,
    l10n,
} from "./config.js";
import {
    merge,
    Iterator,
} from "./utils.js";
import {
    getConf,
    getBlockAttrs,
    setBlockAttrs,
} from "./api.js";

import renderer from "./pseudocode/pseudocode.js";

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

function T(key) {
    return l10n(key, window.pseudocode.params.lang);
}

window.onload = async () => {
    // console.log('onload');
    try {
        window.pseudocode = {
            renderer: renderer,
            height: parseInt(window.frameElement?.style?.height) || 256, // 窗口高度
            changed: false, // 是否发生更改
            code: null, // 代码
            html: null, // 渲染后的 DOM

            url: new URL(window.location.href),
            index: document.getElementById('index'),
            picker: document.getElementById('picker'),
            switch: document.getElementById('switch'),
            element: document.getElementById('pseudocode'),
            container: document.getElementById('container'),
            breadcrumb: {
                element: document.getElementById('breadcrumb'),
                status: document.getElementById('status'),
                type: document.getElementById('type'),
                help: document.getElementById('help'),
                example: document.getElementById('example'),
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

            /* 本地化 */
            window.pseudocode.index.title = T('index');
            window.pseudocode.switch.title = T('preview');

            window.pseudocode.breadcrumb.status.title = T('loading');
            window.pseudocode.breadcrumb.type.title = T('pseudocode_js_introduce');

            window.pseudocode.breadcrumb.help.innerText = T('grammar_help');
            window.pseudocode.breadcrumb.help.title = T('more_example');

            window.pseudocode.breadcrumb.example.innerText = T('example');
            window.pseudocode.breadcrumb.example.title = T('quicksort');

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

                /* 渲染 */
                function render() {
                    window.pseudocode.code = window.pseudocode.editor.editor.getValue();
                    // console.log(window.pseudocode.renderer);
                    // console.log(window.pseudocode.params.katexMacros);
                    try {
                        window.pseudocode.html = window.pseudocode.renderer.renderToString(
                            window.pseudocode.code,
                            merge(
                                {},
                                config.pseudocode.PseudocodeRenderOptions,
                                {
                                    captionCount: window.pseudocode.index.value - 1,
                                    katexMacros: window.pseudocode.params.katexMacros,
                                },
                            ),
                        );
                        window.pseudocode.element.style.backgroundColor = 'transparent';
                        window.pseudocode.element.innerHTML = window.pseudocode.html;
                        window.pseudocode.breadcrumb.status.innerText =
                            window.pseudocode.changed
                                ? config.pseudocode.mark.status.changed
                                : config.pseudocode.mark.status.success;
                        window.pseudocode.breadcrumb.status.title =
                            window.pseudocode.changed
                                ? T('changed')
                                : T('render_success');
                    }
                    catch (err) { // 渲染出现错误
                        console.warn(err.message); // 打印错误
                        window.pseudocode.element.style.backgroundColor = '#F001'; // 设置预览背景颜色
                        window.pseudocode.html = err.message; // 保存错误信息
                        window.pseudocode.element.innerText = window.pseudocode.html; // 显示错误信息
                        window.pseudocode.breadcrumb.status.innerText = config.pseudocode.mark.status.error; // 设置错误状态标志
                        window.pseudocode.breadcrumb.status.title = T('render_error');
                    }
                }

                /* 保存 */
                function save() {
                    render(); // 保存前需要先渲染, 将渲染后内容一块保存

                    /* 保存至块属性 */
                    if (window.pseudocode.changed) {
                        // attributes['custom-md'] = window.pseudocode.code;
                        attributes[config.pseudocode.attrs.markdown] = `\`\`\`pseudocode\n${window.pseudocode.code}\n\`\`\``;
                        attributes[config.pseudocode.attrs.index] = window.pseudocode.index.value;
                        attributes[config.pseudocode.attrs.html] = window.pseudocode.html;
                        setBlockAttrs(window.pseudocode.params.id, attributes).then(response => {
                            if (response?.code === 0) { // 保存成功
                                window.pseudocode.changed = false;
                                window.pseudocode.breadcrumb.status.innerText = config.pseudocode.mark.status.success;
                                window.pseudocode.breadcrumb.status.title = T('save_success');
                            }
                            else { // 保存时出错
                                window.pseudocode.breadcrumb.status.innerText = config.pseudocode.mark.status.error;
                                window.pseudocode.breadcrumb.status.title = T('save_error');
                            }
                        });
                    }
                }

                /* 切换为预览模式 */
                function preview() {
                    render();

                    /* 显示渲染结果 */
                    window.pseudocode.container.classList.remove('edit');
                    window.pseudocode.container.classList.add('preview');

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
                        // console.log(window.pseudocode.height);
                        if (window.frameElement?.style)
                            window.frameElement.style.height = `${window.pseudocode.height}px`;
                    }, 0);
                }

                /* 切换为编辑 */
                function edit() {
                    window.pseudocode.container.classList.remove('preview');
                    window.pseudocode.container.classList.add('edit');
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
                    if (window.pseudocode.changed === false) { // 之前没有发生更改
                        window.pseudocode.changed = true;
                        window.pseudocode.breadcrumb.status.innerText = config.pseudocode.mark.status.changed;
                        window.pseudocode.breadcrumb.status.title = T('changed');
                    }
                    if (window.matchMedia("(min-width: 960px)").matches) { // 分屏预览时刷新
                        render();
                    }
                });

                /* 更改语言标签 */
                window.pseudocode.picker.onchange = () => {
                    monaco.editor.setModelLanguage(window.pseudocode.editor.editor.getModel(), window.pseudocode.picker.value);
                    registerCompletionItemProvider(window.pseudocode.picker.value);
                };

                /* 更改序号 */
                window.pseudocode.index.onchange = () => {
                    render();
                    attributes[config.pseudocode.attrs.index] = window.pseudocode.index.value;
                    setBlockAttrs(window.pseudocode.params.id, attributes);
                };

                /* 显示示例 */
                window.pseudocode.breadcrumb.example.onclick = () => {
                    // console.log(window.pseudocode.editor.editor);
                    window.pseudocode.editor.editor.setValue(config.pseudocode.example);
                    render();
                };

                /* 👇👇 右键菜单项 👇👇 */
                // REF [IActionDescriptor | Monaco Editor API](https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.IActionDescriptor.html)
                /* 切换自动换行状态 */
                const wrap_iter = Iterator(['on', 'off'], true);
                window.pseudocode.editor.editor.addAction({
                    id: 'F9E62A24-619E-49EA-A870-B31E6F9D284F', // 菜单项 id
                    label: T('wrap'), // 菜单项名称
                    keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.KeyZ], // 绑定快捷键
                    contextMenuGroupId: '2_view', // 所属菜单的分组
                    contextMenuOrder: 1, // 菜单分组内排序
                    run: () => {
                        window.pseudocode.editor.editor.updateOptions({ wordWrap: wrap_iter.next().value });
                    }, // 点击后执行的操作
                });

                /* 保存 */
                window.pseudocode.editor.editor.addAction({
                    id: '18730D32-5451-4102-B299-BE281BA929B9', // 菜单项 id
                    label: T('save'), // 菜单项名称
                    // REF [KeyMod | Monaco Editor API](https://microsoft.github.io/monaco-editor/api/classes/monaco.KeyMod.html)
                    // REF [KeyCode | Monaco Editor API](https://microsoft.github.io/monaco-editor/api/enums/monaco.KeyCode.html)
                    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS], // 绑定快捷键
                    contextMenuGroupId: '3_file', // 所属菜单的分组
                    contextMenuOrder: 1, // 菜单分组内排序
                    run: () => {
                        setTimeout(save, 0);
                    }, // 点击后执行的操作
                });
                /* 👆👆 右键菜单项 👆👆 */

                /* 切换至预览模式 */
                window.pseudocode.switch.onchange = mode;
                setTimeout(mode, 0);

                /* 加载成功 */
                window.pseudocode.breadcrumb.status.innerText = config.pseudocode.mark.status.success; // 加载完成
                window.pseudocode.breadcrumb.status.title = T('load_success');
            });
        }).catch(err => { throw err });
    }
    catch (error) {
        console.error(error);
        document.getElementById('status').innerText = config.pseudocode.mark.status.error;
        document.getElementById('status').title = T('unknown_error');
    }
};
