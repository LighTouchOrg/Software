/**
 * @jest-environment jsdom
 */

const { ipcRenderer } = require('electron');

function checkMessage(msg) {
  /* Returns 0 if the message is valid, -1 if it's invalid */
  const methods = ["swipe", "move", "click"];
  try {
    let parsed = JSON.parse(msg);
    if (msg.trim() === "") {
      return -1;
    }
    let category = parsed.category;
    if (category === "actions" || category === "settings") {
      let method = parsed.method;
      if (methods.includes(method)) {
        return 0;
      }
    }
    return -1;
  } catch (e) {
    return -1;
  }
}

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
