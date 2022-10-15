/* 语法高亮 */
// REF [Monaco Editor Monarch](https://microsoft.github.io/monaco-editor/monarch.html)
// REF [Monaco Editor 自定义语言的实现 - 掘金](https://juejin.cn/post/6844903734607085582)
export {
    conf,
    language,
};

const conf = {
    comments: {
        lineComment: "%",
        blockComment: ["\\COMMENT{", "}"],
    },
    brackets: [
        ["{", "}"],
        // ["[", "]"],
        // ["(", ")"],
    ],
    autoClosingPairs: [
        { open: "{", close: "}" },
        // { open: "[", close: "]" },
        // { open: "(", close: ")" },
        // { open: "<", close: ">" },
        { open: "$", close: "$", notIn: ["math"] },
    ],
    surroundingPairs: [
        { open: "{", close: "}" },
        // { open: "(", close: ")" },
        // { open: "[", close: "]" },
        // { open: "`", close: "`" },
        { open: "$", close: "$" },
    ],
};

const language = {
    // Set defaultToken to invalid to see what you do not tokenize yet
    // defaultToken: 'invalid',

    /* latex 上下文 */
    environments: [
        '\\begin',
        '\\end',
    ],

    /* latex 命令 */
    commands: [

        /* 说明 */
        '\\caption',

        /* 控制 */
        '\\IF',
        '\\ELSEIF',
        '\\ELSE',
        '\\ENDIF',

        '\\FOR',
        '\\ENDFOR',

        '\\WHILE',
        '\\ENDWHILE',

        '\\REPEAT',
        '\\UNTIL',

        /* 片段 */
        '\\FUNCTION',
        '\\ENDFUNCTION',

        '\\PROCEDURE',
        '\\ENDPROCEDURE',

        /* 调用 */
        '\\CALL',

        /* 字体命令 */
        '\\textnormal',
        '\\uppercase',
        '\\lowercase',
        '\\textrm',
        '\\textsf',
        '\\texttt',
        '\\textup',
        '\\textit',
        '\\textsl',
        '\\textsc',
        '\\textbf',
        '\\textmd',
        '\\textlf',
    ],

    /* latex 声明 */
    declarations: [
        /* 接口 */
        '\\REQUIRE',
        '\\ENSURE',
        '\\INPUT',
        '\\OUTPUT',

        /* 状态 */
        '\\STATE',
        '\\RETURN',
        '\\PRINT',

        /* 命令 */
        '\\BREAK',
        '\\CONTINUE',
    ],

    /* latex 字体/字号名称空间 */
    fonts: [
        /* 字号 */
        '\\tiny',
        '\\scriptsize',
        '\\footnotesize',
        '\\small',

        '\\normalsize',

        '\\large',
        '\\Large',
        '\\LARGE',
        '\\huge',
        '\\HUGE',

        /* 字体 */
        '\\rmfamily',
        '\\sffamily',
        '\\ttfamily',

        '\\upshape',
        '\\itshape',
        '\\slshape',
        '\\scshape',

        '\\bfseries',
        '\\mdseries',
        '\\lfseries',
    ],

    /* latex 常量 */
    constants: [
        /* 布尔值 */
        '\\TRUE',
        '\\FALSE',
    ],

    /* latex 逻辑运算符 */
    logics: [
        '\\AND',
        '\\OR',
        '\\NOT',
        '\\TO',
        '\\DOWNTO',
    ],

    operators: [
        '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
        '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
        '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=',
        '%=', '<<=', '>>=', '>>>=',
    ],

    // we include these common regular expressions
    symbols: /[=><!~?:&|+\-*\/\^%]+/,

    // C# style strings
    escapes: /\\(?:[abfnrtv\\\{\}\$\&\#\%]|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

    // The main tokenizer for our languages
    tokenizer: {
        root: [
            /* 注释 */
            [/(^%.*$)/, "comment"],
            [/(\\COMMENT)(\{)((?:\\\}|[^\}])*)(\})/, ['keyword', 'brackets', 'comment', 'brackets']],

            /* latex 命令与声明 */
            [/\\[a-zA-Z]+(?=[^a-zA-Z]|$)/, {
                /* 二次匹配 */
                cases: {
                    '@declarations': 'key', // latex 声明
                    '@commands': 'keyword', // latex 命令
                    '@environments': 'type', // latex 环境
                    '@constants': 'constant', // 常量
                    '@logics': 'key', // 逻辑关系运算符
                    '@fonts': 'namespace', // 字体/字号
                    '@default': 'key', // 其他
                }
            }],

            /* latex 参数 */
            [/({)(\s*\w+\s*)(})/, ['string.target', 'entity', 'string.target']],

            { include: '@tex' },

            /* 数学公式 */
            [/\$[^\$]*$/, "string.invalid"],
            [/\$/, "string", "@math"],

            // [/(\$)((?:\\\$|[^\$])*)(\$)/, [
            //   'string',
            //   'string',
            //   'string',
            // ]],
        ],

        math: [
            [/\\[a-zA-Z]+(?=[^a-zA-Z]|$)/, {
                cases: {
                    '@environments': 'type', // latex 环境
                    '@default': 'variable', // 其他
                },
            }],
            { include: '@tex' },
            [/\w+/, 'string'],
            [/\$/, "string", "@pop"],
        ],

        tex: [

            /* 转义字符 */
            [/@escapes/, 'string.escape'],

            /* 括号 */
            [/[\{\}\(\)\[\]]/, 'string.target'],

            /* 运算符 */
            [/@symbols/, {
                cases: {
                    '@operators': 'operator',
                    '@default': '',
                },
            }],

            /* 数字 */
            [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
            [/0[xX][0-9a-fA-F]+/, 'number.hex'],
            [/\d+/, 'number'],

            /* 定界符 */
            [/\\\\/, 'delimiter'],

            /* 空白字符 */
            [/\s+/, "white"],
        ],
    },
};
