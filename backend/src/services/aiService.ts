import axios from "axios";

class AIService {
  async analyseMeal(s3Key: string) {
    const response = await axios.post(
      `${process.env.AI_SERVICE_URL}/analyze/meal`,
      {
        s3_key: s3Key,
      },
    );

    return response.data;
  }

  async analyseWorkoutForm(s3Key: string, exerciseName?: string) {
    const response = await axios.post(
      `${process.env.AI_SERVICE_URL}/analyze/form`,
      {
        s3_key: s3Key,
        exercise_name: exerciseName,
      },
    );

    return response.data;
  }
}

export default new AIService();
