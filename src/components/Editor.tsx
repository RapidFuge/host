import React, { useRef, useEffect } from 'react';
import { Highlight, Language, PrismTheme } from 'prism-react-renderer';
import { themes } from 'prism-react-renderer';

interface EditorProps {
    value: string;
    onChange: (value: string) => void;
    language: Language;
    theme?: PrismTheme;
    placeholder?: string;
    className?: string;
}

const Editor: React.FC<EditorProps> = ({
    value,
    onChange,
    language,
    theme = themes.vsDark,
    placeholder,
    className = '',
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const preRef = useRef<HTMLPreElement>(null);

    useEffect(() => {
        const syncScroll = () => {
            const textarea = textareaRef.current;
            const pre = preRef.current;
            if (textarea && pre) {
                pre.scrollTop = textarea.scrollTop;
                pre.scrollLeft = textarea.scrollLeft;
            }
        };
        syncScroll();
    }, [value]);

    const handleScroll = () => {
        const textarea = textareaRef.current;
        const pre = preRef.current;
        if (textarea && pre) {
            pre.scrollTop = textarea.scrollTop;
            pre.scrollLeft = textarea.scrollLeft;
        }
    };

    const sharedStyles: React.CSSProperties = {
        margin: 0,
        border: '0',
        padding: '1rem',
        fontFamily: 'monospace',
        fontSize: '14px',
        lineHeight: '1.625',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        boxSizing: 'border-box',
        width: '100%',
        height: '100%',
    };

    return (
        <div className={`relative w-full h-full ${className}`}>
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onScroll={handleScroll}
                style={{
                    ...sharedStyles,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 1,
                    resize: 'none',
                    background: 'transparent',
                    color: 'transparent',
                    caretColor: 'white',
                }}
                placeholder={placeholder}
                spellCheck="false"
            />
            <Highlight code={value} language={language} theme={theme}>
                {({ className: highlightClassName, style, tokens, getLineProps, getTokenProps }) => (
                    <pre
                        ref={preRef}
                        className={highlightClassName}
                        style={{
                            ...sharedStyles,
                            ...style,
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            pointerEvents: 'none',
                        }}
                        aria-hidden="true"
                    >
                        {tokens.map((line, i) => (
                            <div key={i} {...getLineProps({ line })}>
                                {line.length === 0 ? (
                                    <span> </span>
                                ) : (
                                    line.map((token, key) => (
                                        <span key={key} {...getTokenProps({ token })} />
                                    ))
                                )}
                            </div>
                        ))}
                    </pre>
                )}
            </Highlight>
        </div>
    );
};

export default Editor;