import React from 'react';
import { Toggletip, ToggletipButton, ToggletipContent } from '@carbon/react';
import styles from './FrontPanel.module.scss';
import cn from 'classnames';

interface HelpTargetProps {
  enabled: boolean;
  title: string;
  description: string;
  className?: string;
}

const HelpTarget: React.FC<HelpTargetProps> = ({ enabled, title, description, className }) => {
  if (!enabled) {
    return null;
  }

  const descriptionParagraphs = description
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  return (
    <Toggletip align="bottom" autoAlign className={cn(styles.helpPopover, className)}>
      <ToggletipButton
        className={styles.helpHotspot}
        label={`Show help for ${title}`}
        aria-label={`Show help for ${title}`}
      />
      <ToggletipContent>
        <p className={styles.helpTipTitle}>{title}</p>
        {descriptionParagraphs.map((paragraph, index) => (
          <p key={index} className={styles.helpTipBody}>{paragraph}</p>
        ))}
      </ToggletipContent>
    </Toggletip>
  );
};

export default HelpTarget;
