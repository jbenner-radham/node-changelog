import { UNRELEASED_IDENTIFIER } from '../constants.js';
import { isDefinition, isHeading, isText } from '../identity.js';
import type { ChangeType } from '../types.js';
import { getDate, getNormalizedRepository } from '../util.js';
import { hasUnreleasedHeader } from './unreleased.js';
import type { Root } from 'mdast';
import { normalizeIdentifier } from 'micromark-util-normalize-identifier';
import type { PackageJson } from 'type-fest';
import { u } from 'unist-builder';
import flatMap from 'unist-util-flatmap';
import { select } from 'unist-util-select';

export function withRelease(tree: Root, { changeTypes, pkg, version }: {
  changeTypes: ChangeType[];
  pkg: PackageJson;
  version: string;
}): Root {
  // console.dir(tree, { depth: undefined });

  if (hasUnreleasedHeader(tree)) {
    return withUnreleasedAsRelease(tree, { pkg, version });
  }

  // console.debug('Else...');
  // console.dir(tree, { depth: undefined });
  // return tree;
  const repository = getNormalizedRepository(pkg.repository!);
  let foundReleaseHeading = false;
  let foundVersionDefinition = false;

  return flatMap(tree, node => {
    if (isHeading(node) && node.depth === 2 && !foundReleaseHeading) {
      foundReleaseHeading = true;

      return [
        u('heading', { depth: 2 }, [
          u('linkReference', { identifier: version, referenceType: 'shortcut' as const }, [
            u('text', version)
          ]),
          u('text', ` - ${getDate()}`)
        ]),
        ...changeTypes.flatMap(changeType =>
          [
            u('heading', { depth: 3 }, [
              u('text', changeType)
            ]),
            u('list', { ordered: false, start: null, spread: false }, [
              u('listItem', { checked: null, spread: false }, [
                u('paragraph', [
                  u('text', '...')
                ])
              ])
            ])
          ]
        ),
        node
      ];
    }

    if (isDefinition(node) && /^\d+\.\d+\.\d+$/.test(node.identifier) && !foundVersionDefinition) {
      foundVersionDefinition = true;

      const url = `${repository}/compare/v${pkg.version!}...v${version}`;

      // console.dir(node, { depth: null });

      return [
        u('definition', { identifier: version, url }),
        node
      ];
    }

    return [node];
  });
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
          u('text', ` - ${getDate()}`)
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
