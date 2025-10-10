import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Globe, 
  Image, 
  Upload, 
  MessageSquare, 
  FileText,
  Settings,
  Play,
  Download,
  ExternalLink,
  Zap,
  Brain,
  Database,
  Code2,
  Loader2
} from 'lucide-react';
import { DevvAI, imageGen, webSearch, webReader, upload } from '@devvai/devv-code-backend';

interface ToolResult {
  id: string;
  type: 'ai' | 'image' | 'web-search' | 'web-reader' | 'file-upload';
  timestamp: Date;
  input: any;
  output: any;
  status: 'success' | 'error' | 'processing';
  error?: string;
}

interface AIConversation {
  id: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
}

export function ToolEcosystemHub() {
  const [activeTab, setActiveTab] = useState('ai-chat');
  const [toolResults, setToolResults] = useState<ToolResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // AI Chat State
  const [aiConversations, setAiConversations] = useState<AIConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [aiModel, setAiModel] = useState('default');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  
  // Image Generation State
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageModel, setImageModel] = useState('default');
  const [numImages, setNumImages] = useState(1);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [outputFormat, setOutputFormat] = useState('png');
  
  // Web Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  // Web Reader State
  const [readerUrl, setReaderUrl] = useState('');
  const [extractedContent, setExtractedContent] = useState<any>(null);
  
  // File Upload State
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const ai = new DevvAI();

  // Initialize with a default conversation
  useEffect(() => {
    if (aiConversations.length === 0) {
      const defaultConversation: AIConversation = {
        id: 'default',
        messages: []
      };
      setAiConversations([defaultConversation]);
      setCurrentConversation('default');
    }
  }, []);

  const addToolResult = (result: Omit<ToolResult, 'id' | 'timestamp'>) => {
    const newResult: ToolResult = {
      ...result,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };
    setToolResults(prev => [newResult, ...prev]);
    return newResult.id;
  };

  const updateToolResult = (id: string, updates: Partial<ToolResult>) => {
    setToolResults(prev => prev.map(result => 
      result.id === id ? { ...result, ...updates } : result
    ));
  };

  // AI Chat Functions
  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !currentConversation) return;

    const conversation = aiConversations.find(c => c.id === currentConversation);
    if (!conversation) return;

    // Add user message
    const userMessage = {
      role: 'user' as const,
      content: chatMessage.trim(),
      timestamp: new Date()
    };

    const updatedMessages = [...conversation.messages, userMessage];
    setAiConversations(prev => prev.map(c => 
      c.id === currentConversation 
        ? { ...c, messages: updatedMessages }
        : c
    ));

    const resultId = addToolResult({
      type: 'ai',
      input: { message: chatMessage, model: aiModel },
      output: null,
      status: 'processing'
    });

    setChatMessage('');
    setIsStreaming(true);
    setStreamingContent('');

    try {
      const stream = await ai.chat.completions.create({
        model: aiModel === 'kimi' ? 'kimi-k2-0711-preview' : 'default',
        messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        stream: true,
        max_tokens: 2000,
        temperature: 0.7
      });

      let fullResponse = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          setStreamingContent(fullResponse);
        }
      }

      // Add assistant response
      const assistantMessage = {
        role: 'assistant' as const,
        content: fullResponse,
        timestamp: new Date()
      };

      setAiConversations(prev => prev.map(c => 
        c.id === currentConversation 
          ? { ...c, messages: [...updatedMessages, assistantMessage] }
          : c
      ));

      updateToolResult(resultId, {
        output: { response: fullResponse },
        status: 'success'
      });

    } catch (error) {
      console.error('AI Chat error:', error);
      updateToolResult(resultId, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  // Image Generation Functions
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;

    const resultId = addToolResult({
      type: 'image',
      input: { 
        prompt: imagePrompt, 
        model: imageModel,
        num_outputs: numImages,
        aspect_ratio: aspectRatio,
        output_format: outputFormat
      },
      output: null,
      status: 'processing'
    });

    setIsProcessing(true);

    try {
      const result = await imageGen.textToImage({
        prompt: imagePrompt,
        model: imageModel === 'gemini' ? 'google/gemini-2.5-flash-image' : undefined,
        num_outputs: numImages,
        aspect_ratio: aspectRatio as any,
        output_format: outputFormat as any
      });

      updateToolResult(resultId, {
        output: result,
        status: 'success'
      });

    } catch (error) {
      console.error('Image generation error:', error);
      updateToolResult(resultId, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Web Search Functions
  const handleWebSearch = async () => {
    if (!searchQuery.trim()) return;

    const resultId = addToolResult({
      type: 'web-search',
      input: { query: searchQuery },
      output: null,
      status: 'processing'
    });

    setIsProcessing(true);

    try {
      const result = await webSearch.search({
        query: searchQuery
      });

      setSearchResults(result.data || []);
      
      updateToolResult(resultId, {
        output: result,
        status: 'success'
      });

    } catch (error) {
      console.error('Web search error:', error);
      updateToolResult(resultId, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Web Reader Functions
  const handleWebReader = async () => {
    if (!readerUrl.trim()) return;

    const resultId = addToolResult({
      type: 'web-reader',
      input: { url: readerUrl },
      output: null,
      status: 'processing'
    });

    setIsProcessing(true);

    try {
      const result = await webReader.read({
        url: readerUrl
      });

      setExtractedContent(result.data);
      
      updateToolResult(resultId, {
        output: result,
        status: 'success'
      });

    } catch (error) {
      console.error('Web reader error:', error);
      updateToolResult(resultId, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // File Upload Functions
  const handleFileUpload = async (file: File) => {
    const resultId = addToolResult({
      type: 'file-upload',
      input: { filename: file.name, size: file.size },
      output: null,
      status: 'processing'
    });

    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const result = await upload.uploadFile(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (upload.isErrorResponse(result)) {
        throw new Error(`${result.errCode}: ${result.errMsg}`);
      }

      setUploadedFiles(prev => [...prev, result]);
      
      updateToolResult(resultId, {
        output: result,
        status: 'success'
      });

      setTimeout(() => setUploadProgress(0), 1000);

    } catch (error) {
      console.error('File upload error:', error);
      updateToolResult(resultId, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      setUploadProgress(0);
    }
  };

  const currentConversationData = aiConversations.find(c => c.id === currentConversation);

  return (
    <div className="flex h-full bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="w-2/3 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Built-in Tool Ecosystem</h2>
          <p className="text-gray-600">Comprehensive integration of AI, web, image, and file processing capabilities</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="ai-chat" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              AI Chat
            </TabsTrigger>
            <TabsTrigger value="image-gen" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Images
            </TabsTrigger>
            <TabsTrigger value="web-search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search
            </TabsTrigger>
            <TabsTrigger value="web-reader" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Reader
            </TabsTrigger>
            <TabsTrigger value="file-upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Files
            </TabsTrigger>
          </TabsList>

          <div className="bg-white rounded-lg border border-orange-200 shadow-sm h-full">
            <TabsContent value="ai-chat" className="p-6 h-full">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-4 mb-4">
                  <h3 className="text-lg font-medium">AI Chat Interface</h3>
                  <Select value={aiModel} onValueChange={setAiModel}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="kimi">Kimi K2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 border border-gray-200 rounded-lg p-4 mb-4 overflow-y-auto bg-gray-50">
                  {currentConversationData?.messages.map((message, index) => (
                    <div key={index} className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-orange-500 text-white' 
                          : 'bg-white border border-gray-200'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <span className="text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {isStreaming && (
                    <div className="mb-4 flex justify-start">
                      <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-white border border-gray-200">
                        <p className="text-sm">{streamingContent}</p>
                        <span className="animate-pulse text-orange-500">▋</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Input
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={isStreaming}
                  />
                  <Button onClick={handleSendMessage} disabled={isStreaming || !chatMessage.trim()}>
                    {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="image-gen" className="p-6">
              <h3 className="text-lg font-medium mb-4">Image Generation</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Prompt</label>
                  <Textarea
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="Describe the image you want to generate..."
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Model</label>
                    <Select value={imageModel} onValueChange={setImageModel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="gemini">Google Gemini 2.5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Number of Images</label>
                    <Select value={numImages.toString()} onValueChange={(v) => setNumImages(parseInt(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Aspect Ratio</label>
                    <Select value={aspectRatio} onValueChange={setAspectRatio}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1:1">1:1 Square</SelectItem>
                        <SelectItem value="16:9">16:9 Landscape</SelectItem>
                        <SelectItem value="9:16">9:16 Portrait</SelectItem>
                        <SelectItem value="3:2">3:2 Photo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Format</label>
                    <Select value={outputFormat} onValueChange={setOutputFormat}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="png">PNG</SelectItem>
                        <SelectItem value="jpg">JPG</SelectItem>
                        <SelectItem value="webp">WebP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button onClick={handleGenerateImage} disabled={isProcessing || !imagePrompt.trim()} className="w-full">
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                  Generate Images
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="web-search" className="p-6">
              <h3 className="text-lg font-medium mb-4">Web Search</h3>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search the web..."
                    onKeyPress={(e) => e.key === 'Enter' && handleWebSearch()}
                  />
                  <Button onClick={handleWebSearch} disabled={isProcessing || !searchQuery.trim()}>
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>
                
                {searchResults.length > 0 && (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-blue-600 hover:text-blue-800">
                                <a href={result.url} target="_blank" rel="noopener noreferrer">
                                  {result.title}
                                </a>
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">{result.description}</p>
                              <p className="text-xs text-gray-400 mt-2">{result.url}</p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-gray-400 ml-2 mt-1" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="web-reader" className="p-6">
              <h3 className="text-lg font-medium mb-4">Web Content Reader</h3>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={readerUrl}
                    onChange={(e) => setReaderUrl(e.target.value)}
                    placeholder="Enter URL to extract content..."
                    onKeyPress={(e) => e.key === 'Enter' && handleWebReader()}
                  />
                  <Button onClick={handleWebReader} disabled={isProcessing || !readerUrl.trim()}>
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  </Button>
                </div>
                
                {extractedContent && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{extractedContent.title}</CardTitle>
                      {extractedContent.publishedTime && (
                        <p className="text-sm text-gray-500">Published: {new Date(extractedContent.publishedTime).toLocaleDateString()}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">{extractedContent.description}</p>
                      <div className="max-h-64 overflow-y-auto bg-gray-50 p-4 rounded border">
                        <p className="text-sm whitespace-pre-wrap">{extractedContent.content}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="file-upload" className="p-6">
              <h3 className="text-lg font-medium mb-4">File Upload</h3>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Drag and drop files here, or click to browse</p>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      files.forEach(handleFileUpload);
                    }}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button onClick={() => document.getElementById('file-upload')?.click()}>
                    Choose Files
                  </Button>
                </div>
                
                {uploadProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                )}
                
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Uploaded Files</h4>
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                        <div>
                          <p className="font-medium">{file.filename}</p>
                          <p className="text-sm text-gray-500">{file.link}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => window.open(file.link, '_blank')}>
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(file.link || '')}>
                            Copy URL
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Tool Results Sidebar */}
      <div className="w-1/3 border-l border-orange-200 bg-white">
        <div className="p-6">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-orange-500" />
            Tool Results
          </h3>
          
          <div className="space-y-3 max-h-screen overflow-y-auto">
            {toolResults.length === 0 ? (
              <p className="text-gray-500 text-sm">No tool results yet. Start using the tools to see results here.</p>
            ) : (
              toolResults.map((result) => (
                <Card key={result.id} className={`text-sm ${
                  result.status === 'success' ? 'border-green-200' : 
                  result.status === 'error' ? 'border-red-200' : 'border-yellow-200'
                }`}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={result.status === 'success' ? 'default' : result.status === 'error' ? 'destructive' : 'secondary'}>
                        {result.type}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {result.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-gray-600">Input:</p>
                        <p className="text-xs bg-gray-50 p-2 rounded overflow-hidden">
                          {JSON.stringify(result.input, null, 2)}
                        </p>
                      </div>
                      
                      {result.output && (
                        <div>
                          <p className="text-xs font-medium text-gray-600">Output:</p>
                          <div className="text-xs bg-gray-50 p-2 rounded max-h-20 overflow-y-auto">
                            {result.type === 'image' && result.output.images ? (
                              <div className="space-y-1">
                                {result.output.images.map((url: string, index: number) => (
                                  <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block">
                                    Image {index + 1}
                                  </a>
                                ))}
                              </div>
                            ) : (
                              <pre className="whitespace-pre-wrap">{JSON.stringify(result.output, null, 2)}</pre>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {result.error && (
                        <div>
                          <p className="text-xs font-medium text-red-600">Error:</p>
                          <p className="text-xs bg-red-50 p-2 rounded text-red-700">
                            {result.error}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}