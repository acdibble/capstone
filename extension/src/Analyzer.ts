import type { GraphModel, Tensor2D } from '@tensorflow/tfjs';

export default class Analyzer {
  private static async getVocabulary(): Promise<Record<string, number>> {
    const response = await fetch('../assets/vocab.json');
    if (!response.ok) throw new Error('could not get vocab');
    return response.json() as Promise<Record<string, number>>;
  }

  static async load(): Promise<Analyzer> {
    const vocabulary = (await this.getVocabulary());
    const model = await tf.loadGraphModel('../assets/model.json');
    return new Analyzer(model, vocabulary, -1);
  }

  private constructor(
    private readonly model: GraphModel,
    private readonly dict: Record<string, number>,
    private readonly threshold = 0,
  ) {}

  private encode(sentences: string[]): number[][] {
    const unk = this.dict['[UNK]'];
    return sentences.map((sentence) => sentence.split(/\s+/).map((word) => this.dict[word] ?? unk));
  }

  async classify(tweets: Analyzer.Input[]): Promise<Analyzer.Result[]> {
    if (!tweets.length) return [];
    let result: Tensor2D | undefined;
    let encoded: Tensor2D | undefined;
    try {
      encoded = tf.tensor2d(this.encode(tweets.map((t) => t.text)));
      result = await this.model.executeAsync(encoded) as Tensor2D;
      const data = await result.data() as Float32Array;
      return tweets.map(({ id }, i) => ({ id, result: data[i] < this.threshold }));
    } catch (error) {
      console.error(error);
    } finally {
      result?.dispose();
      encoded?.dispose();
    }
    return tweets.map(({ id }) => ({ id, result: false }));
  }
}
