from openai import AsyncOpenAI

class LLM:
    """
    A class that wraps an OpenAI-compatible Large Language Model (LLM) API client
    for generating text completions asynchronously.

    Attributes:
    ----------
    model : str
        The name of the model to be used for text generation.
    host : str
        The URL of the Ollama API endpoint.
    client : AsyncOpenAI
        The asynchronous OpenAI client used to interact with the LLM API.
    """

    def __init__(self, model: str):
        """
        Initializes an instance of the LLM class.

        Parameters:
        ----------
        model : str
            The name of the model to use for text generation.
        """
        self.model = model
        self.host = "https://ollama.joos.dbvis.de/v1"
        self.client = AsyncOpenAI(api_key='ollama', base_url=self.host)

    async def invoke_prompt(self, system_prompt: str, user_prompt: str) -> str:
        """
        Asynchronously sends a prompt to the LLM API and returns the generated text.

        This method constructs a chat completion request with a system prompt and 
        a user prompt, then sends it to the language model asynchronously.

        Parameters:
        ----------
        system_prompt : str
            The system prompt providing context or instructions to the language model.
        user_prompt : str
            The user's prompt to be processed and completed by the language model.

        Returns:
        -------
        str
            The generated text completion from the LLM API.
        """
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
        )
        return response.choices[0].message.content
    