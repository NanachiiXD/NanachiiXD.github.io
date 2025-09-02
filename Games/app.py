import requests
import csv
import re
import os

CSV_FILE = "games.csv"

def get_steam_appid(url_or_id):
    """Extract AppID from URL or return if numeric."""
    match = re.search(r'/app/(\d+)', url_or_id)
    if match:
        return match.group(1)
    if url_or_id.isdigit():
        return url_or_id
    return None

def fetch_steam_game(appid):
    """Fetch game info from Steam API."""
    api_url = f"https://store.steampowered.com/api/appdetails?appids={appid}"
    try:
        res = requests.get(api_url, timeout=10)
        res.raise_for_status()
        data = res.json()
        if not data[appid]['success']:
            print(f"Failed to fetch game data for AppID {appid}")
            return None
        game = data[appid]['data']
        title = game['name']
        img = game['header_image']
        tags = [g['description'] for g in game.get('genres', [])]
        return {"appid": appid, "title": title, "status": "backlog", "tags": tags, "image": img}
    except Exception as e:
        print(f"Error fetching Steam data: {e}")
        return None

def load_existing_appids(csv_file=CSV_FILE):
    """Return a set of AppIDs already in the CSV."""
    if not os.path.isfile(csv_file):
        return set()
    with open(csv_file, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        return {row['appid'] for row in reader}

def append_to_csv(game, csv_file=CSV_FILE):
    """Append game to CSV if not a duplicate."""
    existing = load_existing_appids(csv_file)
    if game["appid"] in existing:
        print(f"{game['title']} (AppID {game['appid']}) is already in the CSV. Skipping.")
        return

    file_exists = os.path.isfile(csv_file)
    with open(csv_file, mode='a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
        if not file_exists:
            # Write header if file is new
            writer.writerow(["appid","title","status","tags","image"])
        writer.writerow([
            f'"{game["title"].replace("\"","\"\"")}"',  # double any internal quotes
            game["appid"],
            game["status"],
            ";".join(game["tags"]),
            game["image"]
        ])
    print(f"Added {game['title']} to {csv_file}")

if __name__ == "__main__":
    while True:
        url = input("Enter Steam game URL or AppID (or 'q' to quit): ").strip()
        if url.lower() == 'q':
            break

        appid = get_steam_appid(url)
        if not appid:
            print("Could not parse AppID.")
            continue
        
        game_data = fetch_steam_game(appid)
        if not game_data:
            print("Failed to fetch game data.")
            continue
        
        append_to_csv(game_data)
