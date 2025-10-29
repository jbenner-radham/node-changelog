import { CHANGE_TYPES } from './constants.js';
import { getNormalizedRepository } from './util.js';
import type { Definition, Heading, Node, Nodes } from 'mdast';
import type { PackageJson } from 'type-fest';
import { u } from 'unist-builder';
import flatMap from 'unist-util-flatmap';
import { select } from 'unist-util-select';

export function withUnreleasedSection(tree: Nodes, { pkg }: { pkg: PackageJson }): Nodes {
  if (!pkg.repository) {
    // Do something here...
  }

  if (!pkg.version) {
    // Also, do something here...
  }

  const identifier = 'Unreleased';
  const label = identifier;
  const repository = getNormalizedRepository(pkg.repository!);

  let h2Found = false;
  let versionDefinitionFound = false;

  return flatMap(tree, (node: Node) => {
    if (node.type === 'heading' && (node as Heading).depth === 2 && !h2Found) {
      h2Found = true;

      const unreleasedSection = [
        u('heading', { depth: 2 }, [
          u('linkReference', { identifier, label, referenceType: 'shortcut' }, [
            u('text', identifier)
          ])
        ]),
        ...CHANGE_TYPES.flatMap(changeType =>
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
}

export function hasUnreleasedDefinition(tree: Nodes): boolean {
  return Boolean(
    select('definition[identifier="Unreleased"]', tree)
  );
}

export function hasUnreleasedHeader(tree: Nodes): boolean {
  return Boolean(
    select('heading[depth="2"] text[value="Unreleased"]', tree)
  );
}
