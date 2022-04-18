/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 */

import type {LexicalEditor} from 'lexical';

import {
  BLOCK_TRANSFORMERS,
  createMarkdownExporter,
  createMarkdownImporter,
  TEXT_TRANSFORMERS,
} from '@lexical/markdown';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import * as React from 'react';
import {useEffect, useState} from 'react';

import useMarkdownShortcuts from './shared/useMarkdownShortcuts';

function useMarkdownExporter(editor: LexicalEditor): string {
  const [markdown, setMarkdown] = useState('');

  useEffect(() => {
    const exportToMarkdown = createMarkdownExporter(
      BLOCK_TRANSFORMERS,
      TEXT_TRANSFORMERS,
    );
    return editor.registerUpdateListener(() => {
      editor.update(() => {
        setMarkdown(exportToMarkdown());
      });
    });
  }, [editor]);

  return markdown;
}

export default function LexicalMarkdownShortcutPlugin(): React$MixedElement {
  const [editor] = useLexicalComposerContext();
  useMarkdownShortcuts(editor);

  const markdown = useMarkdownExporter(editor);

  return <pre>{markdown}</pre>;
}

export {createMarkdownExporter, createMarkdownImporter};
