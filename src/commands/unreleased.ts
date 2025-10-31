import { CHANGE_TYPES, UNRELEASED_IDENTIFIER } from '../constants.js';
import { isDefinition, isHeading } from '../identity.js';
import type { ChangeType } from '../types.js';
import { getNormalizedRepository } from '../util.js';
import type { Definition, Node, Nodes, Root } from 'mdast';
import type { PackageJson } from 'type-fest';
import { u } from 'unist-builder';
import flatMap from 'unist-util-flatmap';
import { select } from 'unist-util-select';

export function withUnreleasedSection(tree: Root, { changeTypes = CHANGE_TYPES, pkg }: {
  changeTypes?: ChangeType[];
  pkg: PackageJson;
}): Root {
  if (!pkg.repository) {
    // Do something here...
  }

  if (!pkg.version) {
    // Also, do something here...
  }

  const identifier = UNRELEASED_IDENTIFIER;
  const label = identifier;
  const repository = getNormalizedRepository(pkg.repository!);
  const hasPreexistingH2 = hasUnreleasedHeader(tree);

  let h2Found = false;
  let versionDefinitionFound = false;

  const newTree = flatMap(tree, (node: Node) => {
    // TODO: Disabling linking pre-existing "Unreleased" headers for now. Look into this later!
    // if (isHeading(node) && node.depth === 2 && hasPreexistingH2) {
    //   const [child] = node.children;
    //
    //   if (child?.type === 'text' && child?.value === identifier) {
    //     node.children = [
    //       u('linkReference', { identifier, label, referenceType: 'shortcut' as const }, [
    //         u('text', identifier)
    //       ])
    //     ];
    //   }
    // }

    if (isHeading(node) && node.depth === 2 && !h2Found && !hasPreexistingH2) {
      h2Found = true;

      const unreleasedSection = [
        u('heading', { depth: 2 }, [
          u('linkReference', { identifier, label, referenceType: 'shortcut' }, [
            u('text', identifier)
          ])
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
        )
      ];

      return [...unreleasedSection, node];
    }

    if (isDefinition(node) && /^\d+\.\d+\.\d+$/.test(node.identifier) && !versionDefinitionFound) {
      versionDefinitionFound = true;

      const unreleasedDefinition: Definition = {
        type: 'definition',
        identifier,
        label,
        url: `${repository}/compare/v${pkg.version}...HEAD`
      };

      return [unreleasedDefinition, node];
    }

    return [node];
  });

  if (!hasUnreleasedHeader(newTree)) {
    newTree.children.push(...[
      u('heading', { depth: 2 }, [
        u('linkReference', { identifier, label, referenceType: 'shortcut' }, [
          u('text', identifier)
        ])
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
      )
    ]);
  }

  if (hasUnreleasedHeaderLink(tree) && !hasUnreleasedDefinition(newTree)) {
    // TODO: Look into if this URL syntax works for BitBucket and GitLab.
    newTree.children.push(u('definition', {
      identifier,
      label,
      url: `${repository}/compare/v${pkg.version}...HEAD`
    }));
  }

  return newTree;
}

export function hasUnreleasedDefinition(tree: Nodes): boolean {
  return Boolean(
    select(`definition[identifier="${UNRELEASED_IDENTIFIER}"]`, tree)
  );
}

export function hasUnreleasedHeader(tree: Nodes): boolean {
  return Boolean(
    select(`heading[depth="2"] text[value="${UNRELEASED_IDENTIFIER}"]`, tree)
  );
}

export function hasUnreleasedHeaderLink(tree: Nodes): boolean {
  const identifier = UNRELEASED_IDENTIFIER;

  return Boolean(
    select(
      `heading[depth="2"] linkReference[identifier="${identifier}"] text[value="${identifier}"]`,
      tree
    )
  );
}
