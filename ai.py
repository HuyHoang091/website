from transformers import AutoTokenizer, AutoModelForCausalLM
from transformers import BitsAndBytesConfig

model_name = "vinai/PhoGPT-4B"

bnb_config = BitsAndBytesConfig(load_in_4bit=True)

tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    quantization_config=bnb_config,
    device_map="auto"
)

input_text = "Bộ luật Việt Nam quy định gì về trách nhiệm hình sự?"
inputs = tokenizer(input_text, return_tensors="pt").to(model.device)

outputs = model.generate(**inputs, max_new_tokens=50)

print("Output token IDs:", outputs[0].tolist())  # In token IDs
print("Decoded output:", tokenizer.decode(outputs[0].toList(), skip_special_tokens=True))  # In text
