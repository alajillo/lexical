/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 */
import LexicalComposer from '@lexical/react/LexicalComposer';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {HistoryPlugin} from '@lexical/react/LexicalHistoryPlugin';
import PlainTextPlugin from '@lexical/react/LexicalPlainTextPlugin';
import {mergeRegister} from '@lexical/utils';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $setSelection,
  BLUR_COMMAND,
  FOCUS_COMMAND,
} from 'lexical';
import * as React from 'react';
import {useEffect, useState} from 'react';

import PlaygroundNodes from './nodes/PlaygroundNodes';
import PlaygroundEditorTheme from './themes/PlaygroundEditorTheme';
import ContentEditable from './ui/ContentEditable';
import Placeholder from './ui/Placeholder';

export default function MarkdownEditor({
  value,
  onChange,
}: $ReadOnly<{
  onChange: (string) => void,
  value: string,
}>): React$Node {
  const [isFocused, setIsFocused] = useState(false);
  const initialConfig = {
    namespace: 'PlaygroundEditor',
    nodes: [...PlaygroundNodes],
    onError: (error) => {
      throw error;
    },
    theme: PlaygroundEditorTheme,
  };
  return (
    <div style={{position: 'relative'}}>
      <LexicalComposer initialConfig={initialConfig}>
        <PlainTextPlugin
          contentEditable={<ContentEditable />}
          placeholder={<Placeholder>Enter markdown text</Placeholder>}
        />
        <HistoryPlugin />
        <UpdateContentPlugin value={value} />
        {isFocused ? (
          <OnChangePlugin onChange={onChange} />
        ) : (
          <UpdateContentPlugin value={value} />
        )}
        <OnFocusPlugin
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </LexicalComposer>
    </div>
  );
}

function OnFocusPlugin({
  onFocus,
  onBlur,
}: $ReadOnly<{onBlur: () => void, onFocus: () => void}>): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        FOCUS_COMMAND,
        () => {
          onFocus();
          return false;
        },
        1,
      ),
      editor.registerCommand(
        BLUR_COMMAND,
        () => {
          onBlur();
          return false;
        },
        1,
      ),
    );
  });

  return null;
}

function UpdateContentPlugin({value}: $ReadOnly<{value: string}>): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.update(() => {
      const root = $getRoot();
      root.clear();
      value.split('\n').forEach((line) => {
        root.append($createParagraphNode().append($createTextNode(line)));
      });
      $setSelection(null);
    });
  }, [editor, value]);

  return null;
}

function OnChangePlugin({
  onChange,
}: $ReadOnly<{onChange: (string) => void}>): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      editor.update(() => {
        const root = $getRoot();
        onChange(root.getTextContent());
      });
    });
  }, [editor, onChange]);

  return null;
}
