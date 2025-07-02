/**
 * @jest-environment jsdom
 */

const { checkMessage } = require('./renderer');
const { ipcRenderer } = require('electron');

jest.mock('electron', () => ({
  ipcRenderer: {
    getApiClass: jest.fn()
  }
}));

describe('Message Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('valid message processing', () => {
    const mockApi = {
      swipe: jest.fn().mockReturnValue(0)
    };
    ipcRenderer.getApiClass.mockReturnValue(mockApi);
    
    const result = checkMessage(
      '{"category": "actions", "method": "swipe", "params": {"direction": "right"}}'
    );
    
    expect(result).toBe(0);
  });

  test('invalid category handling', () => {
    ipcRenderer.getApiClass.mockImplementation(() => {
      throw new Error('Category not found');
    });
    
    const result = checkMessage(
      '{"category": "Invalid", "method": "swipe", "params": {}}'
    );
    
    expect(result).toBe(-1);
  });

  test('invalid method handling', () => {
    const mockApi = {
      swipe: jest.fn().mockReturnValue(0)
    };
    ipcRenderer.getApiClass.mockReturnValue(mockApi);

    const result = checkMessage(
      '{"category": "actions", "method": "Invalid", "params": {}}'
    );

    expect(result).toBe(-1);
  })

  test('empty message handling', () => {
    const mockApi = {
      swipe: jest.fn().mockReturnValue(0)
    };
    ipcRenderer.getApiClass.mockReturnValue(mockApi);

    const result = checkMessage(
      ''
    );

    expect(result).toBe(-1);
  })
});
