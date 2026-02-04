import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Control, Display } from './controls';

const simhMocks = {
  init: vi.fn<[], Promise<void>>(),
  restart: vi.fn<[], Promise<void>>(),
  onOutput: vi.fn<[((text: string) => void) | null], Promise<void>>(),
  onRunState: vi.fn<[(running: boolean) => void], void>(),
  sendCommand: vi.fn<[string, { streamOutput?: boolean; echo?: boolean }?], Promise<string>>(),
  examine: vi.fn<[string, { echo?: boolean }?], Promise<Record<string, string>>>(),
  deposit: vi.fn<[string, string, { echo?: boolean }?], Promise<void>>(),
  getYieldSteps: vi.fn<[], Promise<number>>(),
  setYieldSteps: vi.fn<[number], Promise<void>>(),
  stop: vi.fn<[], Promise<void>>(),
};

vi.mock('../workerClient', () => simhMocks);
vi.mock('../debug', () => ({
  debugLog: vi.fn(),
  errorLog: vi.fn(),
}));

const defaultState: Record<string, string> = {
  AR: '0000',
  PR: '0000000000+',
  ACCLO: '0000000000+',
  ACCUP: '0000000000+',
  DIST: '0000000000+',
  CSW: '0000000000+',
  CSWPS: '0',
  CSWOS: '0',
  HALF: '0',
};

const setupService = async () => {
  vi.resetModules();
  const service = await import('./service');
  return service;
};

const flushPromises = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
};

describe('i650 service', () => {
  beforeEach(() => {
    simhMocks.init.mockResolvedValue(undefined);
    simhMocks.restart.mockResolvedValue(undefined);
    simhMocks.onOutput.mockResolvedValue(undefined);
    simhMocks.onRunState.mockImplementation(() => {});
    simhMocks.sendCommand.mockResolvedValue('');
    simhMocks.examine.mockResolvedValue({ ...defaultState });
    simhMocks.deposit.mockResolvedValue(undefined);
    simhMocks.getYieldSteps.mockResolvedValue(100);
    simhMocks.setYieldSteps.mockResolvedValue(undefined);
    simhMocks.stop.mockResolvedValue(undefined);
  });

  it('updates display switch without touching SIMH', async () => {
    const service = await setupService();
    service.setDisplaySwitch(Display.READ_OUT_STORAGE);
    expect(service.getState().displaySwitch).toBe(Display.READ_OUT_STORAGE);
    expect(simhMocks.sendCommand).not.toHaveBeenCalled();
  });

  it('sets console switches and updates state', async () => {
    const service = await setupService();
    await service.init();
    await flushPromises();

    await service.setConsoleSwitches('1111111111+');
    expect(simhMocks.deposit).toHaveBeenCalledWith('CSW', '1111111111+');
    expect(service.getState().consoleSwitches).toBe('1111111111+');
  });

  it('reverts state on failed deposit', async () => {
    const service = await setupService();
    await service.init();
    await flushPromises();

    simhMocks.deposit.mockRejectedValueOnce(new Error('fail'));
    simhMocks.examine.mockResolvedValueOnce({
      ...defaultState,
      CSW: '2222222222+',
    });

    await expect(service.setConsoleSwitches('9999999999+')).rejects.toThrow('fail');
    expect(service.getState().consoleSwitches).toBe('2222222222+');
  });

  it('manual read-out storage transfers to distributor', async () => {
    const service = await setupService();
    await service.init();
    await flushPromises();

    simhMocks.examine.mockImplementation(async (ref: string) => {
      if (ref === 'STATE') return { ...defaultState };
      if (ref === '8000') return { '8000': '1234567890+' };
      return {};
    });

    service.setControlSwitch(Control.MANUAL_OPERATION);
    service.setDisplaySwitch(Display.READ_OUT_STORAGE);
    await service.setAddressRegister('8000');

    await service.startProgramOrTransfer();

    expect(simhMocks.deposit).toHaveBeenCalledWith('DIST', '1234567890+');
    expect(simhMocks.sendCommand).not.toHaveBeenCalledWith('GO', { streamOutput: true });
  });

  it('starts program when not in manual mode', async () => {
    const service = await setupService();
    await service.init();
    await flushPromises();

    service.setControlSwitch(Control.RUN);
    await service.startProgramOrTransfer();

    expect(simhMocks.sendCommand).toHaveBeenCalledWith('GO', { streamOutput: true });
  });
});
