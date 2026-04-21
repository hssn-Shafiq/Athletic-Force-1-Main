import axios from 'axios';

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong') {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as { message?: string } | string | undefined;

    if (typeof responseData === 'string' && responseData.trim()) {
      return responseData;
    }

    if (responseData && typeof responseData === 'object' && typeof responseData.message === 'string' && responseData.message.trim()) {
      return responseData.message;
    }

    if (error.message) {
      return error.message;
    }

    return fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
