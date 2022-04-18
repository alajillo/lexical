/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 */

import {
  BLOCK_TRANSFORMERS,
  createMarkdownExporter,
  createMarkdownImporter,
  TEXT_TRANSFORMERS,
} from '@lexical/markdown';
import AutoFocusPlugin from '@lexical/react/LexicalAutoFocusPlugin';
import AutoScrollPlugin from '@lexical/react/LexicalAutoScrollPlugin';
import CharacterLimitPlugin from '@lexical/react/LexicalCharacterLimitPlugin';
import LexicalClearEditorPlugin from '@lexical/react/LexicalClearEditorPlugin';
import {CollaborationPlugin} from '@lexical/react/LexicalCollaborationPlugin';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import HashtagsPlugin from '@lexical/react/LexicalHashtagPlugin';
import {HistoryPlugin} from '@lexical/react/LexicalHistoryPlugin';
import LinkPlugin from '@lexical/react/LexicalLinkPlugin';
import ListPlugin from '@lexical/react/LexicalListPlugin';
import LexicalMarkdownShortcutPlugin from '@lexical/react/LexicalMarkdownShortcutPlugin';
import LexicalOnChangePlugin from '@lexical/react/LexicalOnChangePlugin';
import PlainTextPlugin from '@lexical/react/LexicalPlainTextPlugin';
import RichTextPlugin from '@lexical/react/LexicalRichTextPlugin';
import TablesPlugin from '@lexical/react/LexicalTablePlugin';
import {$createHeadingNode} from '@lexical/rich-text';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $setSelection,
} from 'lexical';
import * as React from 'react';
import {useCallback, useMemo, useRef, useState} from 'react';

import {createWebsocketProvider} from './collaboration';
import {useSettings} from './context/SettingsContext';
import {useSharedHistoryContext} from './context/SharedHistoryContext';
import MarkdownEditor from './MarkdownEditor.jsx';
import ActionsPlugin from './plugins/ActionsPlugin';
import AutocompletePlugin from './plugins/AutocompletePlugin';
import AutoLinkPlugin from './plugins/AutoLinkPlugin';
import CharacterStylesPopupPlugin from './plugins/CharacterStylesPopupPlugin';
import ClickableLinkPlugin from './plugins/ClickableLinkPlugin';
import CodeHighlightPlugin from './plugins/CodeHighlightPlugin';
import EmojisPlugin from './plugins/EmojisPlugin';
import EquationsPlugin from './plugins/EquationsPlugin';
import ExcalidrawPlugin from './plugins/ExcalidrawPlugin';
import HorizontalRulePlugin from './plugins/HorizontalRulePlugin';
import ImagesPlugin from './plugins/ImagesPlugin';
import KeywordsPlugin from './plugins/KeywordsPlugin';
import ListMaxIndentLevelPlugin from './plugins/ListMaxIndentLevelPlugin';
import MentionsPlugin from './plugins/MentionsPlugin';
import PollPlugin from './plugins/PollPlugin';
import SpeechToTextPlugin from './plugins/SpeechToTextPlugin';
import TableCellActionMenuPlugin from './plugins/TableActionMenuPlugin';
import TableCellResizer from './plugins/TableCellResizer';
import ToolbarPlugin from './plugins/ToolbarPlugin';
import TreeViewPlugin from './plugins/TreeViewPlugin';
import TwitterPlugin from './plugins/TwitterPlugin';
import YouTubePlugin from './plugins/YouTubePlugin';
import ContentEditable from './ui/ContentEditable';
import Placeholder from './ui/Placeholder';

const skipCollaborationInit =
  window.parent != null && window.parent.frames.right === window;

function prepopulatedRichText() {
  const root = $getRoot();
  if (root.getFirstChild() === null) {
    const heading = $createHeadingNode('h1');
    heading.append($createTextNode('Welcome to the playground'));
    root.append(heading);
    const paragraph = $createParagraphNode();
    paragraph.append(
      $createTextNode('This is an '),
      $createTextNode('example').toggleFormat('bold'),
      $createTextNode(' editor component built with '),
      $createTextNode('@lexical/react').toggleFormat('code'),
      $createTextNode('.'),
      $createTextNode(' Try writing in some text with '),
      $createTextNode('different').toggleFormat('italic'),
      $createTextNode(' formats.'),
    );
    root.append(paragraph);
    const paragraph2 = $createParagraphNode();
    paragraph2.append(
      $createTextNode(
        'Make sure to check out the various plugins in the toolbar. You can also use #hashtags or @-mentions too!',
      ),
    );
    root.append(paragraph2);
  }
}

export default function Editor(): React$Node {
  const {historyState} = useSharedHistoryContext();
  const [editor] = useLexicalComposerContext();
  const {
    settings: {
      isCollab,
      isAutocomplete,
      isCharLimit,
      isCharLimitUtf8,
      isRichText,
      showTreeView,
      emptyEditor,
    },
  } = useSettings();
  const text = isCollab
    ? 'Enter some collaborative rich text...'
    : isRichText
    ? 'Enter some rich text...'
    : 'Enter some plain text...';
  const placeholder = <Placeholder>{text}</Placeholder>;
  const scrollRef = useRef(null);
  const updateToMarkdown = useMemo(() => {
    const exportMarkdown = createMarkdownExporter(
      BLOCK_TRANSFORMERS,
      TEXT_TRANSFORMERS,
    );
    return () => {
      editor.update(() => {
        setMarkdown(exportMarkdown());
      });
    };
  }, [editor]);
  const [markdown, setMarkdown] = useState('');

  const onChange = useCallback(() => {
    updateToMarkdown();
  }, [updateToMarkdown]);

  const updateFromMarkdown = useMemo(() => {
    const importMarkdown = createMarkdownImporter(
      BLOCK_TRANSFORMERS,
      TEXT_TRANSFORMERS,
    );
    return (markdownString) => {
      editor.update(() => {
        importMarkdown(markdownString);
        $setSelection(null);
      });
    };
  }, [editor]);

  return (
    <>
      {isRichText && <ToolbarPlugin />}
      <div
        className={`editor-container ${showTreeView ? 'tree-view' : ''} ${
          !isRichText ? 'plain-text' : ''
        }`}
        ref={scrollRef}>
        <AutoFocusPlugin />
        <LexicalClearEditorPlugin />
        <MentionsPlugin />
        <EmojisPlugin />
        <ExcalidrawPlugin />
        <HashtagsPlugin />
        <KeywordsPlugin />
        <HorizontalRulePlugin />
        <SpeechToTextPlugin />
        <AutoLinkPlugin />
        <CharacterStylesPopupPlugin />
        <EquationsPlugin />
        <AutoScrollPlugin scrollRef={scrollRef} />
        {isRichText ? (
          <>
            {isCollab ? (
              <CollaborationPlugin
                id="main"
                providerFactory={createWebsocketProvider}
                shouldBootstrap={!skipCollaborationInit}
              />
            ) : (
              <HistoryPlugin externalHistoryState={historyState} />
            )}
            <RichTextPlugin
              contentEditable={<ContentEditable />}
              placeholder={placeholder}
              initialEditorState={
                isCollab ? null : emptyEditor ? undefined : prepopulatedRichText
              }
            />
            <LexicalMarkdownShortcutPlugin />
            <CodeHighlightPlugin />
            <ListPlugin />
            <ListMaxIndentLevelPlugin maxDepth={7} />
            <TablesPlugin />
            <TableCellActionMenuPlugin />
            <TableCellResizer />
            <ImagesPlugin />
            <LinkPlugin />
            <PollPlugin />
            <TwitterPlugin />
            <YouTubePlugin />
            <ClickableLinkPlugin />
            <LexicalOnChangePlugin onChange={onChange} />
          </>
        ) : (
          <>
            <PlainTextPlugin
              contentEditable={<ContentEditable />}
              placeholder={placeholder}
            />
            <HistoryPlugin externalHistoryState={historyState} />
          </>
        )}
        {(isCharLimit || isCharLimitUtf8) && (
          <CharacterLimitPlugin charset={isCharLimit ? 'UTF-16' : 'UTF-8'} />
        )}
        {isAutocomplete && <AutocompletePlugin />}
        <ActionsPlugin isRichText={isRichText} />
      </div>
      {showTreeView && <TreeViewPlugin />}
      <MarkdownEditor value={markdown} onChange={updateFromMarkdown} />
    </>
  );
}
