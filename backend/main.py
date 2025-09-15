import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_community.vectorstores import Chroma
from langchain.chains import RetrievalQA
from langchain_community.llms import CTransformers
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from huggingface_hub import hf_hub_download
from langchain_community.document_loaders import TextLoader
from langchain_huggingface import HuggingFaceEmbeddings

# --- 1. Global Setup (Runs only once on startup) ---

# Define a Pydantic model for the request body
# This ensures the data sent from the frontend is in the correct format
class SuggestionRequest(BaseModel):
    inputText: str
    remedyType: str

print("Starting server setup...")

# --- Prepare the Medication Knowledge Base ---
medication_kb_path = "./medication_kb"
medication_docs = []
if os.path.exists(medication_kb_path):
    for filename in os.listdir(medication_kb_path):
        if filename.endswith(".txt"):
            loader = TextLoader(os.path.join(medication_kb_path, filename))
            medication_docs.extend(loader.load())

if not medication_docs:
    print("Warning: No medication files found. The medication lookup will not work.")
else:
    medication_text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    medication_split_docs = medication_text_splitter.split_documents(medication_docs)
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    medication_vector_store = Chroma.from_documents(medication_split_docs, embeddings)
    print("Medication Knowledge Base created successfully.")

# --- Prepare the Symptom Alternatives ---
symptom_kb_path = "./symptoms_kb"
symptom_docs = []
if os.path.exists(symptom_kb_path):
    for filename in os.listdir(symptom_kb_path):
        if filename.endswith(".txt"):
            loader = TextLoader(os.path.join(symptom_kb_path, filename))
            symptom_docs.extend(loader.load())

if not symptom_docs:
    print("Warning: Symptom alternatives files not found.")
else:
    symptom_text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100, separators=["*"])
    symptom_split_docs = symptom_text_splitter.split_documents(symptom_docs)
    symptom_vector_store = Chroma.from_documents(symptom_split_docs, embeddings)
    print("Symptoms Knowledge Base created successfully.")

# --- Download and Load the Local LLM ---
model_name = "TheBloke/Mistral-7B-Instruct-v0.2-GGUF"
model_file = "mistral-7b-instruct-v0.2.Q5_K_M.gguf"

print("Downloading and loading the language model...")
model_path = hf_hub_download(repo_id=model_name, filename=model_file)

llm = CTransformers(
    model=model_path,
    model_type="mistral",
    config={'max_new_tokens': 256, 'temperature': 0.1, 'context_length': 4096},
    gpu_layers=50  # Keep this if you have a GPU, otherwise set to 0
)
print("Model loaded successfully.")
print("-" * 50)

# --- 2. Initialize FastAPI Application ---
app = FastAPI()

# --- 3. Configure CORS ---
# This is crucial! It allows your frontend (running on a different port)
# to make requests to this backend.
origins = ["*"] # Allow all origins for simplicity in development

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 4. The Core Logic Function ---
def get_ai_suggestion(medication_input: str):
    """
    This function contains the core RAG logic, refactored from the original script.
    """
    try:
        if not medication_docs or not symptom_docs:
            return "Error: One or more knowledge bases are not loaded. Please check server logs."

        retriever = medication_vector_store.as_retriever(search_kwargs={'k': 3})
        med_info_docs = retriever.invoke(medication_input)

        medication_is_present = any(medication_input.lower() in doc.page_content.lower() for doc in med_info_docs)
        if not medication_is_present:
            return f"I could not find information for '{medication_input}' in my database."

        med_info = med_info_docs[0].page_content
        source_med_name = med_info_docs[0].metadata.get('source', 'Unknown')
        print(f"Found information for '{source_med_name}'.")
        print(f"Medical info content: {med_info}")

        # More robust parsing for extracting symptoms/uses
        symptom_query = ""
        if 'Uses: ' in med_info:
            uses_part = med_info.split('Uses: ')[1]
            if '\n' in uses_part:
                symptom_query = uses_part.split('\n')[0].strip()
            else:
                symptom_query = uses_part.strip()
            
            # Get the first use if multiple are comma-separated
            if ',' in symptom_query:
                symptom_query = symptom_query.split(',')[0].strip()
        else:
            # Fallback: try to extract from the medication name or use the input
            symptom_query = medication_input.lower()
        
        print(f"Identifying the primary use as: '{symptom_query}'.")

        retriever_symptom = symptom_vector_store.as_retriever(search_kwargs={'k': 3})
        alt_info_docs = retriever_symptom.invoke(symptom_query)

        if not alt_info_docs:
            return f"I could not find alternative medications for '{symptom_query}'."

        alt_info = alt_info_docs[0].page_content
        print(f"Alternative info content: {alt_info}")

        final_query = f"""
        You are a helpful AI assistant for pharmacists. Your task is to provide clear, safe, and concise information based on the provided context. Do not hallucinate or make up information.

        ---

        The user has asked for an alternative to the medication: {medication_input}.

        Here is the information I have for the primary medication:
        {med_info}

        Here is a list of other medications with similar uses:
        {alt_info}

        ---

        Based ONLY on the information above, please provide a response with the following structure:

        *1. Summary of the Medication:*
        - What is the medication?
        - What is its primary use?

        *2. Suggested Alternatives:*
        - Provide a bulleted list of the alternative medications and remedies found in the context.

        **3. Safety Disclaimer:**
        - Add a final, prominent warning that this information is for reference only and not a substitute for professional medical advice. Always consult a qualified healthcare professional before making any decisions.
        """

        response = llm.invoke(final_query)
        return response

    except Exception as e:
        print(f"An error occurred in get_ai_suggestion: {e}")
        import traceback
        traceback.print_exc()
        return f"An internal error occurred: {str(e)}. Please check the server logs for details."


# --- 5. Define the API Endpoint ---
@app.post("/get_suggestions")
async def get_suggestions_endpoint(request: SuggestionRequest):
    """
    This is the function that will be called when the frontend sends a request.
    """
    print(f"Received request for: {request.inputText}")
    # Here you can add logic to handle different remedy types if needed
    # For now, we assume 'alternative-medication' is the main goal
    if request.remedyType == "alternative-medication":
        suggestion = get_ai_suggestion(request.inputText)
    else:
        # Placeholder for other remedy types
        suggestion = f"Logic for '{request.remedyType}' is not yet implemented. You asked about: '{request.inputText}'"
    
    return {"suggestion": suggestion}

print("Server setup complete. Ready to accept requests.")