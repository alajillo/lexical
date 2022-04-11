/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 */

import type {BlockTransformer, TextTransformer} from './MarkdownPlugin';
import type {ElementNode, TextNode} from 'lexical';

import {$isLinkNode} from '@lexical/link';
import {$getRoot, $isElementNode, $isTextNode} from 'lexical';

export function createMarkdownExporter(
  blockTransformers: Array<BlockTransformer>,
  textTransformers: Array<TextTransformer>,
): () => string {
  return () => {
    const output = [];
    const children = $getRoot().getChildren();

    for (const child of children) {
      if ($isElementNode(child)) {
        output.push(exportElement(child, blockTransformers));
      }
    }

    return output.join('\n');
  };
}

function exportElement(
  node: ElementNode,
  blockTransformers: Array<BlockTransformer>,
): string {
  for (const transformer of blockTransformers) {
    const result = transformer[2](node, exportChildren);
    if (result != null) {
      return result;
    }
  }
  return exportChildren(node);
}

function exportChildren(node: ElementNode): string {
  const output = [];
  const children = node.getChildren();
  for (const child of children) {
    if ($isTextNode(child)) {
      output.push(exportTextNode(child, child.getTextContent()));
    } else if ($isLinkNode(child)) {
      const linkContent = `[${child.getTextContent()}](${child.getURL()})`;
      const firstChild = child.getFirstChild();
      // Add text styles only if link has single text node inside. If it's more
      // then one we either ignore it and have single <a> to cover whole link,
      // or process them, but then have link cut into multiple <a>.
      // For now chosing the first option.
      if (child.getChildrenSize() === 1 && $isTextNode(firstChild)) {
        output.push(exportTextNode(firstChild, linkContent));
      } else {
        output.push(linkContent);
      }
    } else if ($isElementNode(child)) {
      output.push(exportChildren(child));
    }
  }

  return output.join('');
}

function exportTextNode(node: TextNode, textContent: string): string {
  if (node.hasFormat('code')) {
    return '`' + textContent + '`';
  }

  // TODO:
  // Generate this based on textTransformers list
  let output = textContent;
  const formats = [
    ['italic', '*'],
    ['bold', '**'],
    ['strikethrough', '~~'],
  ];

  for (const [format, tag] of formats) {
    if (node.hasFormat(format)) {
      output = tag + output + tag;
    }
  }

  return output;
}
