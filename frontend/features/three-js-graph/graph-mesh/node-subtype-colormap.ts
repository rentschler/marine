import { SubType } from '@/types/graph-types';

export const SubTypeColorMap: Record<SubType, string> = {
  [SubType.AccessPermission]: '#e6194b', // vivid red
  [SubType.Assessment]: '#3cb44b', // vivid green
  [SubType.Collaborate]: '#ffe119', // bright yellow
  [SubType.Colleagues]: '#0082c8', // bright blue
  [SubType.Communication]: '#f58231', // orange
  [SubType.Coordinates]: '#911eb4', // purple
  [SubType.Criticize]: '#46f0f0', // cyan
  [SubType.Enforcement]: '#f032e6', // magenta
  [SubType.Fishing]: '#d2f53c', // lime
  [SubType.Friends]: '#fabebe', // pink
  [SubType.Group]: '#008080', // teal
  [SubType.HarborReport]: '#e6beff', // light purple
  [SubType.Jurisdiction]: '#aa6e28', // brown
  [SubType.Location]: '#fffac8', // light yellow
  [SubType.Monitoring]: '#800000', // dark red
  [SubType.Operates]: '#aaffc3', // mint
  [SubType.Organization]: '#808000', // olive
  [SubType.Person]: '#ffd8b1', // peach
  [SubType.Reports]: '#000080', // navy
  [SubType.Suspicious]: '#808080', // gray
  [SubType.TourActivity]: '#bcf60c', // bright lime
  [SubType.TransponderPing]: '#ff6f69', // coral
  [SubType.Unfriendly]: '#ff33cc', // hot pink
  [SubType.Vessel]: '#3366ff', // strong blue
  [SubType.VesselMovement]: '#b10dc9', // rich purple
};
