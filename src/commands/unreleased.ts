import { CHANGE_TYPES, UNRELEASED_IDENTIFIER } from '../constants.js';
import type { ChangeType } from '../types.js';
import { getNormalizedRepository } from '../util.js';
import type { Definition, Heading, Node, Nodes } from 'mdast';
import type { PackageJson } from 'type-fest';
import { u } from 'unist-builder';
import flatMap from 'unist-util-flatmap';
import { select } from 'unist-util-select';

export function withUnreleasedSection(tree: Nodes, { changeTypes = CHANGE_TYPES, pkg }: {
  changeTypes?: ChangeType[];
  pkg: PackageJson;
}): Nodes {
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
    if (node.position) {
      delete node.position;
    }

    if (node.type === 'heading' && (node as Heading).depth === 2 && hasPreexistingH2) {
      const [child] = (node as Heading).children;

      if (child?.type === 'text' && child?.value === identifier) {
        (node as Heading).children = [
          u('linkReference', { identifier, label, referenceType: 'shortcut' as const }, [
            u('text', identifier)
          ])
        ];
      }
    }

    if (node.type === 'heading' && (node as Heading).depth === 2 && !h2Found && !hasPreexistingH2) {
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

    if (
      node.type === 'definition' &&
      /^\d+\.\d+\.\d+$/.test((node as Definition).identifier) &&
      !versionDefinitionFound
    ) {
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

  if (!hasUnreleasedDefinition(newTree)) {
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
