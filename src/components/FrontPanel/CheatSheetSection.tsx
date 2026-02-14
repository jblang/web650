import React, { useState } from 'react';
import { Button, Form, TextInput, Theme } from '@carbon/react';
import { Download, Export } from '@carbon/icons-react';
import * as i650Service from '@/lib/simh/i650';
import {
  normalizeAddress,
  normalizeWord,
} from '@/lib/simh/i650/format';
import styles from './CheatSheetSection.module.scss';

interface CheatSheetSectionProps {
  consoleSwitches: string;
  addressRegister: string;
  programRegister: string;
  upperAccumulator: string;
  lowerAccumulator: string;
  distributor: string;
}

type FieldKey =
  | 'upperAccumulator'
  | 'lowerAccumulator'
  | 'distributor'
  | 'programRegister'
  | 'consoleSwitches'
  | 'addressRegister';

type FieldMeta = {
  key: FieldKey;
  id: string;
  label: string;
  maxLength: number;
};

const isAddressField = (field: FieldKey): boolean => field === 'addressRegister';
const WORD_EDIT_PATTERN = /^([+-]?\d{0,10}|\d{0,10}[+-]?)$/;
const ADDRESS_EDIT_PATTERN = /^\d{0,4}$/;

const getNextInputValue = (
  currentValue: string,
  selectionStart: number | null,
  selectionEnd: number | null,
  insertedText: string
): string => {
  const start = selectionStart ?? currentValue.length;
  const end = selectionEnd ?? start;
  return `${currentValue.slice(0, start)}${insertedText}${currentValue.slice(end)}`;
};

const normalizeAddressForCommit = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  return normalizeAddress(digits === '' ? '0' : digits);
};

const normalizeWordForCommit = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed === '') {
    return normalizeWord('0');
  }
  if (/^[+-]$/.test(trimmed)) {
    return normalizeWord(`${trimmed}0`);
  }
  return normalizeWord(trimmed);
};

const CheatSheetSection: React.FC<CheatSheetSectionProps> = ({
  consoleSwitches,
  addressRegister,
  programRegister,
  upperAccumulator,
  lowerAccumulator,
  distributor,
}) => {
  const [drafts, setDrafts] = useState<Partial<Record<FieldKey, string>>>({});

  const sourceValues: Record<FieldKey, string> = {
    upperAccumulator,
    lowerAccumulator,
    distributor,
    programRegister,
    consoleSwitches,
    addressRegister,
  };

  const fields: FieldMeta[] = [
    { key: 'upperAccumulator', id: 'accup-input', label: 'Upper Accumulator (ACCUP)', maxLength: 11 },
    { key: 'lowerAccumulator', id: 'acclo-input', label: 'Lower Accumulator (ACCLO)', maxLength: 11 },
    { key: 'programRegister', id: 'pr-input', label: 'Program Register (PR)', maxLength: 11 },
    { key: 'consoleSwitches', id: 'csw-input', label: 'Console Switches (CSW)', maxLength: 11 },
    { key: 'addressRegister', id: 'ar-input', label: 'Address Register (AR)', maxLength: 4 },
    { key: 'distributor', id: 'dist-input', label: 'Distributor (DIST)', maxLength: 11 },
  ];

  const commitField = async (field: FieldKey): Promise<void> => {
    const rawValue = (drafts[field] ?? sourceValues[field]);

    if (field === 'addressRegister') {
      const normalized = normalizeAddressForCommit(rawValue);
      await i650Service.setAddressRegister(normalized);
      setDrafts((prev) => ({ ...prev, addressRegister: normalized }));
    } else {
      const normalized = normalizeWordForCommit(rawValue);
      if (field === 'programRegister') {
        await i650Service.setProgramRegister(normalized);
      } else if (field === 'consoleSwitches') {
        await i650Service.setConsoleSwitches(normalized);
      } else if (field === 'distributor') {
        await i650Service.setDistributor(normalized);
      } else if (field === 'lowerAccumulator') {
        await i650Service.setLowerAccumulator(normalized);
      } else {
        await i650Service.setUpperAccumulator(normalized);
      }
      setDrafts((prev) => ({ ...prev, [field]: normalized }));
    }
  };

  const onFieldChange = (field: FieldKey, next: string) => {
    const valid = isAddressField(field)
      ? ADDRESS_EDIT_PATTERN.test(next)
      : WORD_EDIT_PATTERN.test(next);
    if (!valid) return;
    setDrafts((prev) => ({ ...prev, [field]: next }));
  };

  const handleExamineClick = async () => {
    const rawAddress = (drafts.addressRegister ?? sourceValues.addressRegister);
    const normalizedAddress = normalizeAddressForCommit(rawAddress);
    const value = await i650Service.examineMemory(normalizedAddress);
    const normalizedValue = normalizeWordForCommit(value);
    await i650Service.setDistributor(normalizedValue);
    setDrafts((prev) => ({
      ...prev,
      addressRegister: normalizedAddress,
      distributor: normalizedValue,
    }));
  };

  const handleDepositClick = async () => {
    const rawAddress = (drafts.addressRegister ?? sourceValues.addressRegister);
    const rawDistributor = (drafts.distributor ?? sourceValues.distributor);
    const normalizedAddress = normalizeAddressForCommit(rawAddress);
    const normalizedDistributor = normalizeWordForCommit(rawDistributor);
    await i650Service.depositMemory(normalizedAddress, normalizedDistributor);
    setDrafts((prev) => ({
      ...prev,
      addressRegister: normalizedAddress,
      distributor: normalizedDistributor,
    }));
  };

  return (
    <Theme theme="g90" className={styles.cheatTheme}>
      <section className={styles.cheatSection} data-testid="cheat-sheet-section">
        <Form className={styles.formLayout}>
          {fields.map(({ key, id, label, maxLength }) => (
            <TextInput
              key={id}
              id={id}
              labelText={label}
              maxLength={maxLength}
              value={drafts[key] ?? sourceValues[key]}
              className={styles.textInput}
              onChange={(event) => onFieldChange(key, event.currentTarget.value)}
              onBeforeInput={(event) => {
                if (!event.data) return;
                const input = event.currentTarget as HTMLInputElement;
                const nextValue = getNextInputValue(
                  input.value,
                  input.selectionStart,
                  input.selectionEnd,
                  event.data
                );
                const valid = isAddressField(key)
                  ? ADDRESS_EDIT_PATTERN.test(nextValue)
                  : WORD_EDIT_PATTERN.test(nextValue);
                if (!valid) {
                  event.preventDefault();
                }
              }}
              onPaste={(event) => {
                const pastedText = event.clipboardData.getData('text');
                const input = event.currentTarget as HTMLInputElement;
                const nextValue = getNextInputValue(
                  input.value,
                  input.selectionStart,
                  input.selectionEnd,
                  pastedText
                );
                const valid = isAddressField(key)
                  ? ADDRESS_EDIT_PATTERN.test(nextValue)
                  : WORD_EDIT_PATTERN.test(nextValue);
                if (!valid) {
                  event.preventDefault();
                }
              }}
              onBlur={() => {
                void commitField(key);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void commitField(key);
                }
              }}
            />
          ))}
          <div className={styles.actionsCell}>
            <Button
              type="button"
              size="md"
              kind="primary"
              hasIconOnly
              renderIcon={Export}
              iconDescription="Examine"
              tooltipPosition="top"
              onClick={() => void handleExamineClick()}
            />
            <Button
              type="button"
              size="md"
              kind="primary"
              hasIconOnly
              renderIcon={Download}
              iconDescription="Deposit"
              tooltipPosition="top"
              onClick={() => void handleDepositClick()}
            />
          </div>
        </Form>
      </section>
    </Theme>
  );
};

export default CheatSheetSection;
