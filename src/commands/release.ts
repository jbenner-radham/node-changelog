import { UNRELEASED_IDENTIFIER } from '../constants.js';
import { isDefinition, isHeading, isText } from '../identity.js';
import { getDate, getNormalizedRepository } from '../util.js';
import { hasUnreleasedHeader } from './unreleased.js';
import type { Root } from 'mdast';
import { normalizeIdentifier } from 'micromark-util-normalize-identifier';
import type { PackageJson } from 'type-fest';
import { u } from 'unist-builder';
import flatMap from 'unist-util-flatmap';
import { select } from 'unist-util-select';

export function withRelease(tree: Root, { pkg, version }: {
  pkg: PackageJson;
  version: string;
}): Root {
  if (hasUnreleasedHeader(tree)) {
    return withUnreleasedAsRelease(tree, { pkg, version });
  }

  // console.debug('Else...');
  // console.dir(tree, { depth: undefined });
  return tree;
}

export function withUnreleasedAsRelease(tree: Root, { pkg, version }: {
  pkg: PackageJson;
  version: string;
}): Root {
  if (!pkg.repository) {
    // Do something here...
  }

  if (!pkg.version) {
    // Also, do something here...
  }

  const repository = getNormalizedRepository(pkg.repository!);
  const newTree = flatMap(tree, node => {
    if (isHeading(node) && node.depth === 2) {
      const text = select(`text[value="${UNRELEASED_IDENTIFIER}"]`, node);

      if (isText(text)) {
        // TODO: Handle instances where the `text` node is not the only child.
        text.value = version;
        node.children = [
          u('linkReference', { identifier: version, referenceType: 'shortcut' as const }, [
            text
          ]),
          u('text', { value: ` - ${getDate()}` })
        ];
      }
    } else if (
      isDefinition(node) &&
      normalizeIdentifier(node.identifier) === normalizeIdentifier(UNRELEASED_IDENTIFIER)
    ) {
      node.identifier = version;
      node.label = version;
      node.url = `${repository}/compare/v${pkg.version}...v${version}`;
    }

    return [node];
  });

  const definition = select(`definition[identifier="${version}"]`, newTree);

  if (!definition) {
    newTree.children.push(
      u('definition', {
        identifier: version,
        label: version,
        url: `${repository}/releases/tag/v${version}`
      })
    );
  }

  return newTree;
}
