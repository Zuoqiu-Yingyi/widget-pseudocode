import { merge } from './utils.js';

export var config = {
    token: '',
    pseudocode: {
        UI: {
            fontFamily: [ // 界面字体
                '"Sarasa Mono SC"',
                '"Microsoft YaHei"',
                '"幼圆"',
            ],
        },
        regs: {
            id: /^\d{14}\-[0-9a-z]{7}$/, // 块 ID 正则表达式
            query: /^\s*\{\{(.*)\}\}\s*$/, // 嵌入块正则表达式
            code: /^\s*\`{3,}\s*(\w*)\s*\n/, // 代码块正则表达式
            file: /^file:\/*(.*)$/, // 文件路径正则表达式
        },
        mark: {
            status: { // 状态
                changed: '📝', // 已编辑且未保存标记
                error: '✖', // 错误标记
                success: '✅', // 成功标记
            },
        },
        IStandaloneEditorConstructionOptions: {
            // autoClosingBrackets: 'languageDefined', // 是否自动添加后括号(包括中括号)
            // autoClosingDelete: 'languageDefined', // 是否自动删除后括号(包括中括号)
            // autoClosingQuotes: 'languageDefined', // 是否自动添加后单引号 双引号
            automaticLayout: true, // 是否自动布局
            bracketPairColorization: { // 匹配括号颜色
                enabled: true,
            },
            colorDecorators: true, // 是否渲染定义的颜色(CSS 中颜色值)
            copyWithSyntaxHighlighting: false, // 是否复制为富文本
            // cursorSmoothCaretAnimation: true, // 光标平滑移动动画
            fontFamily: [
                '"Sarasa Mono SC"',
                '"JetBrainsMono-Regular"',
                '"mononoki"',
                '"Consolas"',
                '"Liberation Mono"',
                '"Menlo"',
                '"Courier"',
                '"monospace"',
            ].join(','), // 字体
            fontLigatures: true, // 是否启用字体连字
            formatOnPaste: true, // 是否格式化粘贴的内容
            // inDiffEditor: false, // 是启用对比功能
            mouseWheelZoom: true, // 是否使用鼠标滚轮缩放
            readOnly: false, // 是否只读
            tabSize: 4, // Tab 制表符缩进大小
            useShadowDOM: true, // 是否使用 Shadow DOM
            // value: '', // 初始文本
            wordWrap: 'off', // 是否自动换行 "on" | "off" | "wordWrapColumn" | "bounded"
        },
        // REF [options](https://github.com/SaswatPadhi/pseudocode.js#options)
        PseudocodeRenderOptions: {
            indentSize: '1.2em', // 控制块内部的缩进大小，例如，`if`, `for` (单位必须为 em)
            commentDelimiter: '//', // 用于开始和结束注释区域的分隔符 (仅支持行注释)
            lineNumber: true, // 显示行号
            lineNumberPunc: ':', // 行号后缀
            noEnd: false, // 不显示块结束标志, 例如 `end if`
            captionCount: 0, // 标题计数器重置数字
            /* 附加选项: 全局宏 */
            katexMacros: {}, // KaTeX 宏
        },
        attrs: {
            index: 'custom-pseudocode-index',
            markdown: 'data-export-md',
            html: 'data-export-html',
        },
        MAP: {
            LANGS: {
                zh_CN: 'zh-cn',
                zh_CNT: 'zh-tw',
                en_US: '',
                fr_FR: 'fr',
                default: '',
            },
            THEMES: {
                0: 'vs',
                1: 'vs-dark',
                '0': 'vs',
                '1': 'vs-dark',
                'default': 'vs',
            },
        },
        i18n: {
            loading: { zh_CN: '加载中', default: 'Loading' },
            changed: { zh_CN: '已更改', default: 'Changed' },
            error: { zh_CN: '错误', default: 'Error' },
            success: { zh_CN: '成功', default: 'Success' },
            index: { zh_CN: '编号', default: 'Index' },
            preview: { zh_CN: '预览', default: 'Preview' },
            pseudocode_js_introduce: {
                zh_CN: 'pseudocode.js 可以像 LaTeX 一样对算法进行排版',
                default: 'pseudocode.js enables JavaScript to typeset algorithms as beautifully as LaTeX does',
            },
        },
    },
};

export function l10n(key, lang) {
    return config.pseudocode.i18n?.[key]?.[lang]
        ?? config.pseudocode.i18n?.[key].default
        ?? '';
}

try {
    const custom = import('/widgets/custom.js');
    if (custom?.config?.pseudocode) {
        merge(config.pseudocode, custom.config.pseudocode);
    }
} catch (err) {
    console.warn(err);
} finally {
    console.log(config);
}
