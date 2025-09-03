input_file = "games.csv"
output_file = "conv.csv"

with open(input_file, "r", encoding="utf-8") as infile, \
     open(output_file, "w", encoding="utf-8") as outfile:
    
    lines = infile.readlines()
    
    # Write header unchanged
    if lines:
        outfile.write(lines[0])
    
    # Process remaining lines
    for line in lines[1:]:
        parts = line.strip().split(",")
        if len(parts) >= 2:
            # remove all quotes from second field
            parts[1] = parts[1].replace('"', "")
            # wrap in fresh quotes
            parts[1] = f'"{parts[1]}"'
        outfile.write(",".join(parts) + "\n")

print(f"Transformed file saved as {output_file}")
