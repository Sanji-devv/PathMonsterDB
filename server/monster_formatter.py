import re
import json

def clean_tag_val(val):
    if not val:
        return ''
    if isinstance(val, list):
        return ', '.join([item.get('name', '') if isinstance(item, dict) else str(item) for item in val if item])
    if isinstance(val, str):
        val_s = val.strip()
        if val_s.startswith('[') and val_s.endswith(']'):
            try:
                parsed = json.loads(val_s)
                if isinstance(parsed, list):
                    return ', '.join([item.get('name', '') if isinstance(item, dict) else str(item) for item in parsed if item])
            except Exception:
                pass
        return val_s
    return str(val)

def parse_cr(cr_str):
    if cr_str is None or cr_str == '':
        return -1.0
    s = str(cr_str).strip().lower()
    if s in ('-', 'any', 'n/a', 'none', '?'):
        return -1.0
    # Remove leading "cr" prefix
    s = re.sub(r'^cr\s*', '', s)
    # Check for fraction like 1/2, 1/3, 1/4, 1/6, 1/8
    frac_match = re.search(r'(\d+)\s*/\s*(\d+)', s)
    if frac_match:
        try:
            num = float(frac_match.group(1))
            den = float(frac_match.group(2))
            if den != 0:
                return num / den
        except Exception:
            pass
    # Check for decimal or integer e.g. 0.33, 0.5, 12, 10/MR
    num_match = re.search(r'(\d+(?:\.\d+)?)', s)
    if num_match:
        try:
            return float(num_match.group(1))
        except Exception:
            pass
    return -1.0

def build_editor_state_from_monster(m):
    if not m or not isinstance(m, dict):
        return {'basic': {}, 'dynamic': {}, 'html': {}}
    
    if 'basic' in m and isinstance(m['basic'], dict) and ('in-name' in m['basic'] or 'in-cr' in m['basic']):
        return m
    if 'OriginalState' in m and isinstance(m['OriginalState'], dict) and 'basic' in m['OriginalState']:
        os_basic = m['OriginalState']['basic']
        if isinstance(os_basic, dict) and ('in-name' in os_basic or 'in-cr' in os_basic):
            return m['OriginalState']

    basic = {
        'in-name': str(m.get('Name') or m.get('name') or 'Unnamed Monster'),
        'in-cr': str(m.get('CR') or m.get('cr') or '1'),
        'in-xp': str(m.get('XP') or m.get('xp') or ''),
        'in-alignment': str(m.get('Alignment') or m.get('alignment') or 'N'),
        'in-size': str(m.get('Size') or m.get('size') or 'Medium'),
        'in-type': str(m.get('Type') or m.get('type') or 'Humanoid'),
        'in-aura': str(m.get('Aura') or m.get('aura') or ''),
        'in-speed': str(m.get('Speed') or m.get('speed') or '30 ft.'),
        'in-space': str(m.get('Space') or m.get('space') or '5 ft.'),
        'in-reach': str(m.get('Reach') or m.get('reach') or '5 ft.'),
        'in-str': str(m.get('Str') or m.get('str') or '10'),
        'in-dex': str(m.get('Dex') or m.get('dex') or '10'),
        'in-con': str(m.get('Con') or m.get('con') or '10'),
        'in-int': str(m.get('Int') or m.get('int') or '10'),
        'in-wis': str(m.get('Wis') or m.get('wis') or '10'),
        'in-cha': str(m.get('Cha') or m.get('cha') or '10'),
        'in-bab': str(m.get('BaseAtk') or m.get('base_atk') or '1'),
        'in-cmb-extra': '0',
        'in-cmd-extra': '0',
        'in-init-extra': '0',
        'in-fort': str(m.get('Fort') or m.get('fort') or '+0'),
        'in-ref': str(m.get('Ref') or m.get('ref') or '+0'),
        'in-will': str(m.get('Will') or m.get('will') or '+0'),
        'in-ac-armor': '0',
        'in-ac-shield': '0',
        'in-ac-natural': '0',
        'in-ac-deflection': '0',
        'in-ac-dodge': '0',
        'in-armor-name': '',
        'in-shield-name': '',
        'in-def-abilities': str(m.get('DefensiveAbilities') or m.get('def_abilities') or ''),
        'in-dr': str(m.get('DR') or m.get('dr') or ''),
        'in-immune': str(m.get('Immune') or m.get('immune') or ''),
        'in-resist': str(m.get('Resist') or m.get('resist') or ''),
        'in-weaknesses': str(m.get('Weaknesses') or m.get('weaknesses') or ''),
        'in-sr': str(m.get('SR') or m.get('sr') or ''),
        'in-special-attacks': str(m.get('SpecialAttacks') or m.get('special_attacks') or ''),
        'in-feats': clean_tag_val(m.get('Feats') or m.get('feats') or ''),
        'in-skills': str(m.get('Skills') or m.get('skills') or ''),
        'in-languages': clean_tag_val(m.get('Languages') or m.get('languages') or ''),
        'in-sq': str(m.get('SQ') or m.get('sq') or ''),
        'in-gear': str(m.get('Gear') or m.get('gear') or ''),
        'in-treasure': str(m.get('Treasure') or m.get('treasure') or ''),
        'in-environment': str(m.get('Environment') or m.get('environment') or ''),
        'in-organization': str(m.get('Organization') or m.get('organization') or ''),
        'in-hp': str(m.get('HP') or m.get('hp') or ''),
        'in-init': str(m.get('Init') or m.get('init') or '+0'),
        'in-ac': str(m.get('AC') or m.get('ac') or ''),
    }

    hd_str = str(m.get('HD') or m.get('hd') or '')
    hd_m = re.search(r'(\d+)d(\d+)', hd_str)
    if hd_m:
        basic['in-hd-amount'] = hd_m.group(1)
        basic['in-hd-size'] = hd_m.group(2)
    else:
        basic['in-hd-amount'] = '1'
        basic['in-hd-size'] = '8'

    subtypes = []
    for i in range(1, 7):
        st = m.get(f'subtype{i}')
        if st and str(st).strip():
            subtypes.append(str(st).strip())
    if not subtypes and 'subtypes' in m and isinstance(m['subtypes'], list):
        subtypes = [str(s).strip() for s in m['subtypes'] if s]

    ac_str = str(m.get('AC') or m.get('ac') or m.get('in-ac') or m.get('AC_Mods') or '')
    arm_m = re.search(r'[+\-]?(\d+)\s+armor', ac_str, re.I)
    sh_m = re.search(r'[+\-]?(\d+)\s+shield', ac_str, re.I)
    nat_m = re.search(r'[+\-]?(\d+)\s+natural', ac_str, re.I)
    def_m = re.search(r'[+\-]?(\d+)\s+deflection', ac_str, re.I)
    dog_m = re.search(r'[+\-]?(\d+)\s+dodge', ac_str, re.I)

    ac_armor_val = int(arm_m.group(1)) if arm_m else 0
    ac_shield_val = int(sh_m.group(1)) if sh_m else 0
    ac_def_val = int(def_m.group(1)) if def_m else 0
    ac_dodge_val = int(dog_m.group(1)) if dog_m else 0

    if arm_m:
        basic['in-ac-armor'] = str(ac_armor_val)
    if sh_m:
        basic['in-ac-shield'] = str(ac_shield_val)
    if def_m:
        basic['in-ac-deflection'] = str(ac_def_val)
    if dog_m:
        basic['in-ac-dodge'] = str(ac_dodge_val)

    size_ac_map = {
        'Fine': 8, 'Diminutive': 4, 'Tiny': 2, 'Small': 1, 'Medium': 0,
        'Large': -1, 'Huge': -2, 'Gargantuan': -4, 'Colossal': -8
    }
    size_val = basic['in-size'].capitalize()
    size_mod = size_ac_map.get(size_val, 0)
    dex_val = int(basic['in-dex']) if basic['in-dex'].isdigit() else 10
    dex_mod = (dex_val - 10) // 2

    def_abs_lower = basic['in-def-abilities'].lower()
    type_lower = basic['in-type'].lower()
    is_incorp = any('incorporeal' in s.lower() for s in subtypes) or bool(re.search(r'\bincorporeal\b', def_abs_lower)) or 'incorporeal' in type_lower

    if nat_m:
        basic['in-ac-natural'] = str(int(nat_m.group(1)))
    elif is_incorp:
        basic['in-ac-natural'] = '0'
        if not def_m:
            cha_val = int(basic['in-cha']) if basic['in-cha'].isdigit() else 10
            cha_mod = (cha_val - 10) // 2
            basic['in-ac-deflection'] = str(max(1, cha_mod))
    else:
        ac_num_m = re.search(r'^(\d+)', ac_str.strip())
        ac_total = int(ac_num_m.group(1)) if ac_num_m else 10
        rem_nat = max(0, ac_total - 10 - dex_mod - size_mod - ac_armor_val - ac_shield_val - ac_def_val - ac_dodge_val)
        basic['in-ac-natural'] = str(rem_nat)

    dynamic = {
        'subtypes': subtypes,
        'senses': [],
        'skills': [],
        'slas': [],
        'abilities': [],
        'special_abilities': [],
        'melee': [{'mode': 'raw', 'rawText': str(m.get('Melee') or '')}] if m.get('Melee') else [],
        'ranged': [{'mode': 'raw', 'rawText': str(m.get('Ranged') or '')}] if m.get('Ranged') else [],
        'magic_items': [],
        'spells': []
    }
    return {'basic': basic, 'dynamic': dynamic, 'html': {}}

def format_monster_from_state(state):
    if not isinstance(state, dict) or 'basic' not in state or not isinstance(state['basic'], dict) or ('in-name' not in state['basic'] and 'in-cr' not in state['basic']):
        state = build_editor_state_from_monster(state.get('basic', state) if isinstance(state, dict) else state)

    basic = state.get('basic', {})
    dynamic = state.get('dynamic', {})
    
    def get_val(basic_key, state_key, default=''):
        if basic_key in basic:
            v = basic[basic_key]
            return v if v is not None else default
        if state_key in basic:
            v = basic[state_key]
            return v if v is not None else default
        if state_key in state:
            v = state[state_key]
            return v if v is not None else default
        return default

    name = get_val('in-name', 'Name', 'Unnamed Monster') or 'Unnamed Monster'
    cr = get_val('in-cr', 'CR', '1') or '1'
    xp = get_val('in-xp', 'XP', '')
    alignment = get_val('in-alignment', 'Alignment', 'N') or 'N'
    size = get_val('in-size', 'Size', 'Medium') or 'Medium'
    mtype = get_val('in-type', 'Type', 'Magical Beast') or 'Magical Beast'
    
    hd_amount = basic.get('in-hd-amount') or '1'
    hd_size = basic.get('in-hd-size') or '8'
    raw_hp = get_val('in-hp', 'HP', '')
    if raw_hp:
        # Extract leading numeric HP e.g. "49 (7d12+21)" -> "49"
        m_hp = re.match(r'^(\d+)', str(raw_hp).strip())
        hp_val = m_hp.group(1) if m_hp else str(raw_hp).split('(')[0].strip()
    else:
        hp_val = ''
    
    hd_str = f"{hd_amount}d{hd_size}"
    
    fort = get_val('in-fort', 'Fort', '+0') or '+0'
    ref = get_val('in-ref', 'Ref', '+0') or '+0'
    will = get_val('in-will', 'Will', '+0') or '+0'
    
    str_val = get_val('in-str', 'Str', '10') or '10'
    dex_val = get_val('in-dex', 'Dex', '10') or '10'
    con_val = get_val('in-con', 'Con', '10') or '10'
    int_val = get_val('in-int', 'Int', '10') or '10'
    wis_val = get_val('in-wis', 'Wis', '10') or '10'
    cha_val = get_val('in-cha', 'Cha', '10') or '10'
    
    senses_list = dynamic.get('senses', [])
    senses_parts = []
    for s in senses_list:
        if isinstance(s, dict):
            n = str(s.get('name', '') or '').strip()
            d = str(s.get('dist', '') or '').strip()
            if n:
                senses_parts.append(f"{n} {d}".strip())
    if senses_parts:
        senses_str = ", ".join(senses_parts)
    else:
        senses_str = get_val('in-senses', 'Senses', '')
    
    skills_list = dynamic.get('skills', [])
    skills_parts = []
    for sk in skills_list:
        if isinstance(sk, dict):
            n = str(sk.get('name', '') or '').strip()
            m_val = sk.get('mod', '')
            if m_val is not None and m_val != '':
                m_str = str(m_val).strip()
                if not m_str.startswith('+') and not m_str.startswith('-'):
                    try:
                        int_m = int(m_str)
                        m_str = f"+{int_m}" if int_m >= 0 else str(int_m)
                    except ValueError:
                        pass
            else:
                m_str = ''
            if n:
                skills_parts.append(f"{n} {m_str}".strip())
    if skills_parts:
        skills_str = ", ".join(skills_parts)
    else:
        skills_str = get_val('in-skills', 'Skills', '')
    
    melee_list = dynamic.get('melee', [])
    melee_parts = []
    for atk in melee_list:
        if isinstance(atk, dict):
            if atk.get('mode') == 'raw' or 'rawText' in atk:
                txt = str(atk.get('rawText', '') or '').strip()
                if txt:
                    melee_parts.append(txt)
            else:
                cnt = str(atk.get('count', '1') or '1')
                t = str(atk.get('type', 'bite') or 'bite')
                dice = str(atk.get('dice', '1d6') or '1d6')
                ext = str(atk.get('extra', '') or '').strip()
                part = f"{cnt} {t} ({dice}" + (f" plus {ext}" if ext else "") + ")"
                melee_parts.append(part)
    if melee_parts:
        melee_str = ", ".join(melee_parts)
    else:
        melee_str = get_val('in-melee', 'Melee', '')
    
    ranged_list = dynamic.get('ranged', [])
    ranged_parts = []
    for atk in ranged_list:
        if isinstance(atk, dict):
            if atk.get('mode') == 'raw' or 'rawText' in atk:
                txt = str(atk.get('rawText', '') or '').strip()
                if txt:
                    ranged_parts.append(txt)
            else:
                cnt = str(atk.get('count', '1') or '1')
                t = str(atk.get('type', 'bow') or 'bow')
                dice = str(atk.get('dice', '1d8') or '1d8')
                rng = str(atk.get('range', '') or '').strip()
                ext = str(atk.get('extra', '') or '').strip()
                part = f"{cnt} {t} ({dice}" + (f", range {rng}" if rng else "") + (f" plus {ext}" if ext else "") + ")"
                ranged_parts.append(part)
    if ranged_parts:
        ranged_str = ", ".join(ranged_parts)
    else:
        ranged_str = get_val('in-ranged', 'Ranged', '')
    
    abilities_list = dynamic.get('abilities', [])
    sa_parts = []
    for ab in abilities_list:
        if isinstance(ab, dict):
            aname = str(ab.get('name', '') or '').strip()
            adesc = str(ab.get('desc', '') or '').strip()
            clean_desc = re.sub('<[^<]+?>', '', adesc).strip()
            if aname:
                sa_parts.append(f"{aname} {clean_desc}".strip())
    if sa_parts:
        sa_str = "\n".join(sa_parts)
    elif 'abilities' in dynamic:
        sa_str = ''
    else:
        sa_str = state.get('Special Abilities', '')

    slas_list = dynamic.get('slas', [])
    sla_parts = []
    cl_val = basic.get('in-sla-cl') or ''
    
    for sla in slas_list:
        if isinstance(sla, dict):
            freq = str(sla.get('freq', '') or '').strip()
            spells = sla.get('spells', '')
            if isinstance(spells, list):
                spells_str = ", ".join([s.get('name') if isinstance(s, dict) else str(s) for s in spells if s])
            else:
                spells_str = str(spells or '').strip()
            if spells_str.startswith('[object Object]'):
                spells_str = ''
            if freq or spells_str:
                sla_parts.append(f"{freq}—{spells_str}" if (freq and spells_str) else (freq or spells_str))
                
    if cl_val and not any('CL' in p for p in sla_parts[:2]):
        sla_parts.insert(0, f"({cl_val})")
        
    if sla_parts:
        sla_str = "\n".join(sla_parts)
    elif 'slas' in dynamic:
        sla_str = ''
    else:
        sla_str = state.get('SpellLikeAbilities', '')

    spells_prepared_parts = []
    spells_raw = basic.get('in-spells-data') or dynamic.get('spells')
    if spells_raw:
        try:
            spells_dict = json.loads(spells_raw) if isinstance(spells_raw, str) else spells_raw
            if isinstance(spells_dict, dict):
                for lvl in sorted(spells_dict.keys(), key=lambda x: int(x) if str(x).isdigit() else 999, reverse=True):
                    lvl_obj = spells_dict[lvl]
                    if isinstance(lvl_obj, dict) and lvl_obj.get('spells'):
                        sp_list = lvl_obj['spells']
                        sp_names = [s.get('name') if isinstance(s, dict) else str(s) for s in sp_list if s]
                        if sp_names:
                            lvl_str = "0 (at will)" if str(lvl) == "0" else f"{lvl}th"
                            spells_prepared_parts.append(f"{lvl_str}—{', '.join(sp_names)}")
        except Exception:
            pass
    if not spells_prepared_parts and basic.get('in-spells'):
        spells_prepared_parts.append(str(basic.get('in-spells')))
    spells_prepared_str = "\n".join(spells_prepared_parts) if spells_prepared_parts else state.get('SpellsPrepared', '')
    
    def safe_int(val, default=0):
        try:
            if val is None:
                return default
            s = str(val).strip()
            if not s or s == '-':
                return default
            return int(s)
        except Exception:
            return default

    ac_natural = safe_int(basic.get('in-ac-natural'))
    ac_armor = safe_int(basic.get('in-ac-armor'))
    ac_shield = safe_int(basic.get('in-ac-shield'))
    ac_deflection = safe_int(basic.get('in-ac-deflection'))
    ac_dodge = safe_int(basic.get('in-ac-dodge'))
    dex_mod = (safe_int(dex_val, 10) - 10) // 2
    
    size_ac_map = {
        'Fine': 8, 'Diminutive': 4, 'Tiny': 2, 'Small': 1, 'Medium': 0,
        'Large': -1, 'Huge': -2, 'Gargantuan': -4, 'Colossal': -8
    }
    size_ac = size_ac_map.get(size, 0)
    
    total_ac = 10 + dex_mod + size_ac + ac_natural + ac_armor + ac_shield + ac_deflection + ac_dodge
    touch_ac = 10 + dex_mod + size_ac + ac_deflection + ac_dodge
    ff_ac = 10 + size_ac + ac_natural + ac_armor + ac_shield + ac_deflection + (dex_mod if dex_mod < 0 else 0)

    # Fallback to existing AC values if not calculated or if raw AC was provided
    if total_ac == 10 and (state.get('AC') or basic.get('AC') or basic.get('in-ac')):
        try:
            ac_raw_cand = state.get('AC') or basic.get('AC') or basic.get('in-ac')
            ac_str = str(ac_raw_cand).split(',')[0].strip()
            lead_num = re.search(r'^(\d+)', ac_str)
            if lead_num:
                total_ac = int(lead_num.group(1))
            if state.get('AC_Touch') or basic.get('AC_Touch'):
                touch_ac = safe_int(state.get('AC_Touch') or basic.get('AC_Touch'), touch_ac)
            if state.get('AC_Flat-footed') or basic.get('AC_Flat-footed'):
                ff_ac = safe_int(state.get('AC_Flat-footed') or basic.get('AC_Flat-footed'), ff_ac)
        except Exception:
            pass

    if not hp_val and hd_amount:
        try:
            hp_val = str(int(hd_amount) * (int(hd_size) // 2 + 1))
        except Exception:
            pass
    
    subtypes_raw = dynamic.get('subtypes', [])
    if isinstance(subtypes_raw, list):
        st1 = subtypes_raw[0] if len(subtypes_raw) > 0 else ''
        st2 = subtypes_raw[1] if len(subtypes_raw) > 1 else ''
    elif isinstance(subtypes_raw, str):
        st1 = subtypes_raw
        st2 = ''
    else:
        st1 = ''
        st2 = ''

    gear_raw = get_val('in-gear', 'Gear', '')
    armor_val = get_val('in-armor-name', '', '')
    shield_val = get_val('in-shield-name', '', '')
    magic_items_val = [mi.get('name', mi) if isinstance(mi, dict) else str(mi) for mi in dynamic.get('magic_items', [])]

    all_gear_items = []
    seen_gear = set()

    if gear_raw:
        for item in [p.strip() for p in gear_raw.split(',') if p.strip()]:
            if item.lower() not in seen_gear:
                seen_gear.add(item.lower())
                all_gear_items.append(item)

    for extra in [armor_val, shield_val] + magic_items_val:
        if extra and extra.strip() and extra.strip().lower() not in seen_gear:
            seen_gear.add(extra.strip().lower())
            all_gear_items.append(extra.strip())

    gear_final = ', '.join(all_gear_items)

    rec = {
        "Name": name,
        "CR": str(cr),
        "XP": str(xp),
        "Alignment": alignment,
        "Size": size,
        "Type": mtype,
        "subtype1": st1,
        "subtype2": st2,
        "Init": get_val('in-init', 'Init', '+0') or '+0',
        "Senses": senses_str,
        "Aura": clean_tag_val(get_val('in-aura', 'Aura', '')),
        "AC": str(total_ac),
        "AC_Touch": str(touch_ac),
        "AC_Flat-footed": str(ff_ac),
        "HP": str(hp_val),
        "HD": hd_str,
        "Fort": fort,
        "Ref": ref,
        "Will": will,
        "Speed": get_val('in-speed', 'Speed', '30 ft.') or '30 ft.',
        "Melee": melee_str,
        "Ranged": ranged_str,
        "Space": get_val('in-space', 'Space', '5 ft.') or '5 ft.',
        "Reach": get_val('in-reach', 'Reach', '5 ft.') or '5 ft.',
        "SpecialAttacks": clean_tag_val(get_val('in-special-attacks', 'SpecialAttacks', '')),
        "DefensiveAbilities": clean_tag_val(get_val('in-def-abilities', 'DefensiveAbilities', '')),
        "Weaknesses": clean_tag_val(get_val('in-weaknesses', 'Weaknesses', '')),
        "Organization": get_val('in-organization', 'Organization', ''),
        "Str": str(str_val),
        "Dex": str(dex_val),
        "Con": str(con_val),
        "Int": str(int_val),
        "Wis": str(wis_val),
        "Cha": str(cha_val),
        "BaseAtk": get_val('in-bab', 'BaseAtk', '0') or '0',
        "CMB": get_val('in-cmb', 'CMB', '+0') or '+0',
        "CMD": get_val('in-cmd', 'CMD', '10') or '10',
        "Feats": clean_tag_val(get_val('in-feats', 'Feats', '')),
        "Skills": skills_str,
        "Languages": clean_tag_val(get_val('in-languages', 'Languages', '')),
        "SQ": clean_tag_val(get_val('in-sq', 'SQ', '')),
        "DR": get_val('in-dr', 'DR', ''),
        "Immune": clean_tag_val(get_val('in-immune', 'Immune', '')),
        "Resist": clean_tag_val(get_val('in-resist', 'Resist', '')),
        "SR": get_val('in-sr', 'SR', ''),
        "Environment": get_val('in-environment', 'Environment', ''),
        "Treasure": get_val('in-treasure', 'Treasure', ''),
        "Gear": gear_final,
        "Class1": get_val('Class1', 'Class1', ''),
        "Class1_Lvl": get_val('Class1_Lvl', 'Class1_Lvl', ''),
        "Visibility": str(get_val('in-visibility', 'Visibility', 'public')).lower() if str(get_val('in-visibility', 'Visibility', 'public')).lower() in ('public', 'private') else 'public',
        "AuthorId": get_val('AuthorId', 'AuthorId', '') or get_val('author_id', 'author_id', ''),
        "AuthorName": get_val('AuthorName', 'AuthorName', '') or get_val('author_name', 'author_name', '') or get_val('in-author', 'in-author', ''),
        "IsFavorite": state.get('IsFavorite', False) if not isinstance(state.get('IsFavorite'), str) else state.get('IsFavorite').lower() == 'true',
        "IsUserCustom": True,
        "CharacterFlag": "1" if (basic.get('stat_type') == 'npc' or str(state.get('CharacterFlag', '')) == '1') else "0",
        "SpellLikeAbilities": sla_str,
        "SpellsPrepared": spells_prepared_str,
        "Special Abilities": sa_str,
        "OriginalState": state,
        "_m_name": name.lower(),
        "_m_cr": str(cr).lower(),
        "_m_type": mtype.lower(),
        "_m_size": size.lower(),
        "_m_align": alignment.lower(),
        "_m_env": get_val('in-environment', 'Environment', '').lower(),
        "_m_source": "custom",
        "_m_search_text": f"{name.lower()} {st1.lower()} {st2.lower()} custom".strip()
    }
    m_id = state.get('id') or state.get('Id') or state.get('_id') or (basic.get('id') if isinstance(basic, dict) else None)
    if m_id:
        rec['id'] = str(m_id)
        if isinstance(rec.get('OriginalState'), dict):
            rec['OriginalState']['id'] = str(m_id)
    return rec
