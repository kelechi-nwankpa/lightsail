import { useState, useRef, useCallback } from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  Link,
  Eye,
  Edit,
} from 'lucide-react';

interface PolicyEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: string;
}

export function PolicyEditor({
  value,
  onChange,
  placeholder = 'Write your policy content here...',
  disabled = false,
  minHeight = '400px',
}: PolicyEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = useCallback(
    (before: string, after: string = '', defaultText: string = '') => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end) || defaultText;
      const newValue =
        value.substring(0, start) +
        before +
        selectedText +
        after +
        value.substring(end);

      onChange(newValue);

      // Restore cursor position
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + before.length + selectedText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [value, onChange]
  );

  const handleBold = () => insertMarkdown('**', '**', 'bold text');
  const handleItalic = () => insertMarkdown('*', '*', 'italic text');
  const handleH1 = () => insertMarkdown('\n# ', '\n', 'Heading 1');
  const handleH2 = () => insertMarkdown('\n## ', '\n', 'Heading 2');
  const handleList = () => insertMarkdown('\n- ', '\n', 'List item');
  const handleOrderedList = () => insertMarkdown('\n1. ', '\n', 'List item');
  const handleQuote = () => insertMarkdown('\n> ', '\n', 'Quote');
  const handleLink = () => insertMarkdown('[', '](url)', 'link text');

  // Simple markdown to HTML conversion for preview
  const renderMarkdown = (text: string): string => {
    let html = text
      // Escape HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Headers
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
      // Bold and Italic
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Links
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-primary underline">$1</a>')
      // Lists
      .replace(/^\d+\. (.+)$/gm, '<li class="ml-6 list-decimal">$1</li>')
      .replace(/^- (.+)$/gm, '<li class="ml-6 list-disc">$1</li>')
      // Blockquotes
      .replace(/^&gt; (.+)$/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 italic text-gray-600">$1</blockquote>')
      // Line breaks
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br />');

    return `<p class="mb-4">${html}</p>`;
  };

  const toolbarButtons = [
    { icon: Bold, label: 'Bold', onClick: handleBold },
    { icon: Italic, label: 'Italic', onClick: handleItalic },
    { divider: true },
    { icon: Heading1, label: 'Heading 1', onClick: handleH1 },
    { icon: Heading2, label: 'Heading 2', onClick: handleH2 },
    { divider: true },
    { icon: List, label: 'Bullet List', onClick: handleList },
    { icon: ListOrdered, label: 'Numbered List', onClick: handleOrderedList },
    { divider: true },
    { icon: Quote, label: 'Quote', onClick: handleQuote },
    { icon: Link, label: 'Link', onClick: handleLink },
  ];

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
        {toolbarButtons.map((button, index) => {
          if ('divider' in button) {
            return (
              <div
                key={`divider-${index}`}
                className="w-px h-6 bg-border mx-1"
              />
            );
          }
          const Icon = button.icon;
          return (
            <Button
              key={button.label}
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={button.onClick}
              disabled={disabled || isPreview}
              title={button.label}
            >
              <Icon className="h-4 w-4" />
            </Button>
          );
        })}

        <div className="flex-1" />

        {/* Preview Toggle */}
        <Button
          type="button"
          variant={isPreview ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 gap-2"
          onClick={() => setIsPreview(!isPreview)}
        >
          {isPreview ? (
            <>
              <Edit className="h-4 w-4" />
              Edit
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              Preview
            </>
          )}
        </Button>
      </div>

      {/* Editor / Preview */}
      {isPreview ? (
        <div
          className="prose prose-sm max-w-none p-4 overflow-auto"
          style={{ minHeight }}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full p-4 resize-none font-mono text-sm focus:outline-none",
            "placeholder:text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          style={{ minHeight }}
        />
      )}
    </div>
  );
}
