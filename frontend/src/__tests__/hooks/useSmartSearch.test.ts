import { renderHook, act, waitFor } from '@testing-library/react';
import { useSmartSearch } from '@/hooks/useSmartSearch';
import { aiService } from '@/lib/services';

jest.mock('@/lib/services', () => ({
  aiService: {
    smartSearch: jest.fn(),
  },
}));

const mockedSmartSearch = aiService.smartSearch as jest.MockedFunction<typeof aiService.smartSearch>;

describe('useSmartSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return initial empty state', () => {
    const { result } = renderHook(() => useSmartSearch(''));

    expect(result.current.results).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.categories).toEqual([]);
    expect(result.current.symptoms).toEqual([]);
    expect(result.current.drugNames).toEqual([]);
    expect(result.current.confidence).toBe(0);
  });

  it('should not search for empty query', async () => {
    renderHook(() => useSmartSearch(''));

    act(() => { jest.advanceTimersByTime(600); });

    expect(mockedSmartSearch).not.toHaveBeenCalled();
  });

  it('should not search for whitespace-only query', async () => {
    renderHook(() => useSmartSearch('   '));

    act(() => { jest.advanceTimersByTime(600); });

    expect(mockedSmartSearch).not.toHaveBeenCalled();
  });

  it('should debounce search calls', async () => {
    const mockResponse = {
      success: true,
      data: {
        query: 'head',
        categories: ['Pain Relief'],
        symptoms: ['Headache'],
        drugNames: ['Paracetamol'],
        confidence: 0.8,
      },
    };
    mockedSmartSearch.mockResolvedValue(mockResponse);

    const { rerender } = renderHook(
      ({ query }) => useSmartSearch(query, undefined, undefined, 500),
      { initialProps: { query: 'h' } }
    );

    // Change query quickly multiple times
    rerender({ query: 'he' });
    rerender({ query: 'hea' });
    rerender({ query: 'head' });

    // Before debounce, should not have been called
    expect(mockedSmartSearch).not.toHaveBeenCalled();

    // After debounce
    act(() => { jest.advanceTimersByTime(500); });

    // Should only call once with the final query
    await waitFor(() => {
      expect(mockedSmartSearch).toHaveBeenCalledTimes(1);
      expect(mockedSmartSearch).toHaveBeenCalledWith('head', undefined, undefined);
    });
  });

  it('should populate results on successful search', async () => {
    const mockData = {
      query: 'cold',
      categories: ['Cold & Flu'],
      symptoms: ['Cough', 'Runny nose'],
      drugNames: ['Paracetamol', 'Cough syrup'],
      confidence: 0.9,
    };
    mockedSmartSearch.mockResolvedValue({ success: true, data: mockData });

    const { result } = renderHook(() => useSmartSearch('cold', undefined, undefined, 100));

    act(() => { jest.advanceTimersByTime(100); });

    await waitFor(() => {
      expect(result.current.categories).toEqual(['Cold & Flu']);
      expect(result.current.symptoms).toEqual(['Cough', 'Runny nose']);
      expect(result.current.drugNames).toEqual(['Paracetamol', 'Cough syrup']);
      expect(result.current.confidence).toBe(0.9);
    });
  });

  it('should set error on failed search', async () => {
    mockedSmartSearch.mockResolvedValue({
      success: false,
      error: { code: 'ERR', message: 'Search failed' },
    });

    const { result } = renderHook(() => useSmartSearch('test', undefined, undefined, 100));

    act(() => { jest.advanceTimersByTime(100); });

    await waitFor(() => {
      expect(result.current.error).toBe('Search failed');
      expect(result.current.results).toBeNull();
    });
  });

  it('should handle API exception', async () => {
    mockedSmartSearch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useSmartSearch('test', undefined, undefined, 100));

    act(() => { jest.advanceTimersByTime(100); });

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });
  });

  it('should pass lat/lng to search', async () => {
    mockedSmartSearch.mockResolvedValue({
      success: true,
      data: { query: 'pharmacy', categories: [], symptoms: [], drugNames: [], confidence: 0.5 },
    });

    renderHook(() => useSmartSearch('pharmacy', 6.5, 3.4, 100));

    act(() => { jest.advanceTimersByTime(100); });

    await waitFor(() => {
      expect(mockedSmartSearch).toHaveBeenCalledWith('pharmacy', 6.5, 3.4);
    });
  });

  it('should clear results when query is emptied', () => {
    const { result, rerender } = renderHook(
      ({ query }) => useSmartSearch(query),
      { initialProps: { query: 'test' } }
    );

    rerender({ query: '' });

    expect(result.current.results).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should expose clear function', async () => {
    mockedSmartSearch.mockResolvedValue({
      success: true,
      data: { query: 'test', categories: ['Cat'], symptoms: [], drugNames: [], confidence: 0.5 },
    });

    const { result } = renderHook(() => useSmartSearch('test', undefined, undefined, 100));

    act(() => { jest.advanceTimersByTime(100); });

    await waitFor(() => {
      expect(result.current.categories).toEqual(['Cat']);
    });

    act(() => { result.current.clear(); });

    expect(result.current.results).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should expose manual search that bypasses debounce', async () => {
    mockedSmartSearch.mockResolvedValue({
      success: true,
      data: { query: 'instant', categories: [], symptoms: [], drugNames: ['Aspirin'], confidence: 0.7 },
    });

    const { result } = renderHook(() => useSmartSearch('', undefined, undefined, 500));

    // Manual search should fire immediately
    await act(async () => {
      await result.current.search('instant');
    });

    expect(mockedSmartSearch).toHaveBeenCalledWith('instant', undefined, undefined);
    expect(result.current.drugNames).toEqual(['Aspirin']);
  });
});
