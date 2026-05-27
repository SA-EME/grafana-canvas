// components/ui/DataLinksMenu.tsx
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useTheme2 } from '@grafana/ui';
import type { Field, LinkModel } from '@grafana/data';

interface Props {
  x: number;
  y: number;
  links: Array<LinkModel<Field>>;
  onClose: () => void;
}

export const DataLinksMenu: React.FC<Props> = ({ x, y, links, onClose }) => {
  const theme = useTheme2();

  useEffect(() => {
    const handler = () => onClose();
    const id = setTimeout(() => {
      document.addEventListener('mousedown', handler, { once: true });
    }, 100);
    return () => {
      clearTimeout(id);
      document.removeEventListener('mousedown', handler);
    };
  }, [onClose]);

  const navigate = (link: LinkModel<Field>) => {
    if (link.target === '_blank') {
      window.open(link.href, '_blank');
    } else {
      window.location.href = link.href;
    }
    onClose();
  };

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        top: y,
        left: x,
        zIndex: 99999,
        minWidth: 180,
        background: theme.colors.background.primary,
        border: `1px solid ${theme.colors.border.medium}`,
        borderRadius: 4,
        padding: '4px 0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        pointerEvents: 'all',
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {links.map((link, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '7px 14px',
            color: theme.colors.text.primary,
            fontSize: 13,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = theme.colors.action.hover;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate(link);
          }}
        >
          {link.title}
        </div>
      ))}
    </div>,
    document.body
  );
};
