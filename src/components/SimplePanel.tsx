// components/SimplePanel.tsx
import React from 'react';
import { PanelProps } from '@grafana/data';
import { SimpleOptions } from '../types';
import { CanvasPanel } from './CanvasPanel';

interface Props extends PanelProps<SimpleOptions> {}

export const SimplePanel: React.FC<Props> = (props) => {
  return <CanvasPanel {...props} />;
};
``