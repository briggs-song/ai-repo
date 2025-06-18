import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import { createObjectCsvWriter } from 'csv-writer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// CSV 파일 경로 설정
const csvFilePath = path.join(process.cwd(), 'data', 'results.csv');

// data 디렉토리가 없으면 생성
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
}

// CSV 파일이 없으면 헤더만 있는 파일 생성
if (!fs.existsSync(csvFilePath)) {
  const header = 'Question,Passage,Options,Answer,Explanation\n';
  fs.writeFileSync(csvFilePath, header);
}

// CSV 파일 작성기 생성
const csvWriter = createObjectCsvWriter({
  path: csvFilePath,
  header: [
    { id: 'question', title: 'Question' },
    { id: 'passage', title: 'Passage' },
    { id: 'options', title: 'Options' },
    { id: 'answer', title: 'Answer' },
    { id: 'explanation', title: 'Explanation' }
  ],
  append: true
});

// CSV 문자열 이스케이프 함수
function escapeCsvValue(value) {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export const createQuestion = async (req, res) => {
  try {
    const { prompt, systemInstruction } = req.body;

    if (!prompt || !systemInstruction) {
      return res.status(400).json({
        status: 'error',
        message: '프롬프트는 필수 입력값입니다.'
      });
    }

    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    const responseText = result.candidates[0].content.parts[0].text;
    console.log('AI 응답 원본:', responseText);
    
    // 응답 텍스트를 파싱하여 구조화된 데이터 생성
    const parsedResponse = parseResponse(responseText);
    console.log('파싱된 데이터:', parsedResponse);

    try {
      // CSV 파일에 데이터 추가
      await csvWriter.writeRecords([parsedResponse]);
      console.log('CSV 파일 저장 성공:', csvFilePath);
    } catch (csvError) {
      console.error('CSV 파일 저장 실패:', csvError);
      // CSV 저장 실패 시 수동으로 데이터 추가
      const csvLine = [
        escapeCsvValue(parsedResponse.question),
        escapeCsvValue(parsedResponse.passage),
        escapeCsvValue(parsedResponse.options),
        escapeCsvValue(parsedResponse.answer),
        escapeCsvValue(parsedResponse.explanation)
      ].join(',') + '\n';
      
      fs.appendFileSync(csvFilePath, csvLine);
      console.log('수동 CSV 저장 성공');
    }

    res.json({
      status: 'success',
      message: 'AI 응답이 성공적으로 생성되었습니다.',
      data: {
        response: responseText,
        parsedData: parsedResponse
      }
    });

  } catch (error) {
    console.error('AI 응답 생성 중 에러 발생:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'AI 응답 생성 중 오류가 발생했습니다.'
    });
  }
};

// 응답 텍스트를 파싱하는 함수
function parseResponse(responseText) {
  try {
    let jsonStr = responseText.trim();
    
    // 마크다운 형식의 JSON인 경우 추출
    const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    console.log('파싱할 JSON 문자열:', jsonStr);

    // JSON 문자열 정리
    jsonStr = jsonStr
      .replace(/\n/g, ' ')  // 줄바꿈 제거
      .replace(/\r/g, '')   // 캐리지 리턴 제거
      .replace(/\t/g, ' ')  // 탭 제거
      .replace(/\s+/g, ' '); // 연속된 공백 제거

    const data = JSON.parse(jsonStr);
    console.log('파싱된 JSON 데이터:', data);

    // 필수 필드 검증
    const requiredFields = ['question', 'passage', 'options', 'answer', 'explanation'];
    const missingFields = requiredFields.filter(field => !data[field]);
    if (missingFields.length > 0) {
      throw new Error(`필수 필드가 누락되었습니다: ${missingFields.join(', ')}`);
    }

    // 모든 필드를 문자열로 변환하고 trim 처리
    const cleanedData = {
      question: String(data.question).trim(),
      passage: String(data.passage).trim(),
      options: String(data.options).trim(),
      answer: String(data.answer).trim(),
      explanation: String(data.explanation).trim()
    };

    console.log('정제된 최종 데이터:', cleanedData);
    return cleanedData;
  } catch (error) {
    console.error('응답 파싱 중 에러 발생:', error);
    throw error;
  }
}

