import { LinkType } from '@/types/graph-types';

export const LinkTypeColorMap: Record<LinkType, string> = {
  [LinkType.EvidenceFor]: '#e41a1c',
  [LinkType.Received]: '#377eb8',
  [LinkType.Sent]: '#4daf4a',
  [LinkType.Refers_to]: '#999999',
  [LinkType.Communication]: '#000000',
};
