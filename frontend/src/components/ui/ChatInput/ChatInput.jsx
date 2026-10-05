import { useState, useRef, useCallback } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import * as Popover from '@radix-ui/react-popover';
import 'emoji-picker-element';
import styles from './ChatInput.module.css';
import Button from '../Button/Button';
import smileIcon from "@/assets/icons/smile.svg";
import attachIcon from "@/assets/icons/attach.svg";
import sendIcon from "@/assets/icons/send.svg";

export function ChatInput({ 
  onSendMessage, 
  disabled = false, 
  placeholder = 'Type a message...' 
}) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Bind the web component custom event for emoji clicks
  const pickerRefCallback = useCallback((pickerNode) => {
    if (!pickerNode) return;

    const handleEmojiClick = (event) => {
      // emoji-picker-element returns unicode under event.detail.unicode
      const emoji = event.detail?.unicode;
      if (!emoji) return;

      const textarea = textareaRef.current;

      setText((prev) => {
        if (!textarea) return prev + emoji;

        const start = textarea.selectionStart ?? prev.length;
        const end = textarea.selectionEnd ?? prev.length;
        const updated = prev.slice(0, start) + emoji + prev.slice(end);

        requestAnimationFrame(() => {
          textarea.focus();
          const nextCursor = start + emoji.length;
          textarea.setSelectionRange(nextCursor, nextCursor);
        });

        return updated;
      });
    };

    pickerNode.addEventListener('emoji-click', handleEmojiClick);

    // Clean up when the element unmounts (when popover closes)
    return () => {
      pickerNode.removeEventListener('emoji-click', handleEmojiClick);
    };
  }, []);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validImages = files.filter((f) => f.type.startsWith('image/'));
    setAttachments((prev) => [...prev, ...validImages]);
    e.target.value = '';
  };

  const removeAttachment = (indexToRemove) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;

    onSendMessage({
      text: trimmed,
      attachments,
    });

    setText('');
    setAttachments([]);
    setIsEmojiOpen(false);
  };

  const canSend = !disabled && (text.trim().length > 0 || attachments.length > 0);

  return (
    <div className={styles.wrapper}>
      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div className={styles.tray}>
          {attachments.map((file, idx) => (
            <div key={`${file.name}-${idx}`} className={styles.chip}>
              <img src={URL.createObjectURL(file)} alt="" />
              <Button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeAttachment(idx)}
                aria-label="Remove image"
              >
                &times;
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Main Input Bar */}
      <div className={styles.bar}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          multiple
          hidden
        />

        {/* Attachment Button */}
        <Button
          className={styles.actionButton}
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title="Attach image"
          aria-label="Attach image"
        >
          <img
            className={styles.buttonIcon}
            src={attachIcon}
            alt=""
            width="24"
            height="24"
            aria-hidden="true"
          />
        </Button>

        {/* Expanding Textarea */}
        <TextareaAutosize
          ref={textareaRef}
          className={styles.inputArea}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Messaging unavailable' : placeholder}
          minRows={1}
          maxRows={6}
          disabled={disabled}
        />

        {/* Emoji Popover */}
        <Popover.Root open={isEmojiOpen} onOpenChange={setIsEmojiOpen}>
          <Popover.Trigger asChild>
            <Button
              className={styles.actionButton}
              disabled={disabled}
              title="Insert emoji"
              aria-label="Insert emoji"
            >
              <img
                className={styles.buttonIcon}
                src={smileIcon}
                alt=""
                width="24"
                height="24"
                aria-hidden="true"
              />
            </Button>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Content 
              side="top" 
              align="start" 
              sideOffset={10} 
              className={styles.popoverContainer}
            >
              <emoji-picker ref={pickerRefCallback} />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        {/* Send Button */}
        <Button
          className={styles.sendButton}
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send message"
        >
          <img
            className={styles.buttonIcon}
            src={sendIcon}
            alt=""
            width="24"
            height="24"
            aria-hidden="true"
          />
        </Button>
      </div>
    </div>
  );
}