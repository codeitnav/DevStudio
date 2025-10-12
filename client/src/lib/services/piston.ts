import axios, { AxiosInstance, AxiosResponse } from "axios";
import { LANGUAGE_VERSIONS } from "../../constants";

// Define the response structure from the API
interface ExecuteResponse {
  language: string;
  version: string;
  run: {
    stdout: string;
    stderr: string;
    output: string;
    code: number;
    signal: string | null;
  };
}

// Define the request payload structure
interface ExecuteRequest {
  language: string;
  version: string;
  files: {
    content: string;
    name?: string;
  }[];
}

const API: AxiosInstance = axios.create({
  baseURL: "https://emkc.org/api/v2/piston",
});

export const executeCode = async (
  language: string,
  sourceCode: string
): Promise<ExecuteResponse> => {
  const payload: ExecuteRequest = {
    language: language,
    version: LANGUAGE_VERSIONS[language],
    files: [
      {
        content: sourceCode,
      },
    ],
  };

  const response: AxiosResponse<ExecuteResponse> = await API.post(
    "/execute",
    payload
  );
  
  return response.data;
};
