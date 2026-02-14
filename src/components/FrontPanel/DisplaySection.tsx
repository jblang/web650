import React from 'react';
import BiQuinaryNumber from './BiQuinaryNumber';
import SignDisplay from './SignDisplay';
import HelpTarget from './HelpTarget';
import {
  normalizeWord,
  extractSign,
  extractOperationCode,
  extractDataAddress,
  extractInstructionAddress,
} from '../../lib/simh/i650/format';
import styles from './DisplaySection.module.scss';

interface DisplaySectionProps {
  value: string | number;
  helpEnabled?: boolean;
}

const DISPLAY_LIGHTS_DESCRIPTION =
  "Shows ten digit positions (bi-quinary) plus sign indication. The value of each digit corresponds to the number in the row and column indicated by the lights. Used with the DISPLAY switch to show selected register or storage contents.";

const SIGN_LIGHTS_DESCRIPTION =
  "Shows the sign of the displayed value.";

const DisplaySection: React.FC<DisplaySectionProps> = ({ value, helpEnabled = false }) => {
  // Extract fields and sign (sign is at end: 0000000000+)
  const sign = extractSign(value);
  const opCode = extractOperationCode(value);
  const dataAddress = extractDataAddress(value);
  const instructionAddress = extractInstructionAddress(value);

  return (
    <>
      {/* Labels row */}
      <div
        className={styles.labelBar}
        data-testid="display-section"
        data-display-value={normalizeWord(value)}
      >
        <div className={styles.labelDisplay}>
          DISPLAY
          <HelpTarget
            enabled={helpEnabled}
            title="DISPLAY LIGHTS"
            description={DISPLAY_LIGHTS_DESCRIPTION}
          />
        </div>
        <div className={styles.labelSign}>
          SIGN
          <HelpTarget
            enabled={helpEnabled}
            title="SIGN LIGHTS"
            description={SIGN_LIGHTS_DESCRIPTION}
          />
        </div>
      </div>

      {/* Digits row - digits render directly on parent grid */}
      <div className={styles.digitsRow}>
        <BiQuinaryNumber
          value={opCode}
          digitCount={2}
          testIdPrefix="display"
          className={styles.opCodeGroup}
          cellClassName={styles.digitCell}
        />

        <BiQuinaryNumber
          value={dataAddress}
          digitCount={4}
          testIdPrefix="display"
          className={styles.dataAddressGroup}
          cellClassName={styles.digitCell}
        />

        <BiQuinaryNumber
          value={instructionAddress}
          digitCount={4}
          testIdPrefix="display"
          className={styles.instructionAddressGroup}
          cellClassName={styles.digitCell}
        />
        <HelpTarget
          enabled={helpEnabled}
          title="DISPLAY LIGHTS"
          description={DISPLAY_LIGHTS_DESCRIPTION}
        />
      </div>

      <div className={styles.signGroup}>
        <SignDisplay value={sign} />
        <HelpTarget
          enabled={helpEnabled}
          title="SIGN LIGHTS"
          description={SIGN_LIGHTS_DESCRIPTION}
        />
      </div>
    </>
  );
};

export default DisplaySection;
