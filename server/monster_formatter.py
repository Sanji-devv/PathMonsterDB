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
    if not cr_str or cr_str == '-' or str(cr_str).lower() == 'any': 
        return -1.0
    try:
        s = str(cr_str).strip()
        if '/' in s:
            num, den = s.split('/')
            return float(num) / float(den)
        return float(s)
    except Exception:
        return -1.0

def format_monster_from_state(state):
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

    # Fallback to existing AC values if not calculated
    if total_ac == 10 and state.get('AC'):
        try:
            ac_str = str(state.get('AC', '')).split(',')[0].strip()
            if ac_str.isdigit():
                total_ac = int(ac_str)
            if state.get('AC_Touch'):
                touch_ac = safe_int(state.get('AC_Touch'), touch_ac)
            if state.get('AC_Flat-footed'):
                ff_ac = safe_int(state.get('AC_Flat-footed'), ff_ac)
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
        "Gear": get_val('in-gear', 'Gear', '') or ', '.join([x for x in [get_val('in-armor-name', '', ''), get_val('in-shield-name', '', '')] + [mi.get('name', mi) if isinstance(mi, dict) else str(mi) for mi in dynamic.get('magic_items', [])] if x]),
        "Class1": get_val('Class1', 'Class1', ''),
        "Class1_Lvl": get_val('Class1_Lvl', 'Class1_Lvl', ''),
        "Visibility": str(get_val('in-visibility', 'Visibility', 'public')).lower() if str(get_val('in-visibility', 'Visibility', 'public')).lower() in ('public', 'private') else 'public',
        "AuthorId": get_val('AuthorId', 'AuthorId', '') or get_val('author_id', 'author_id', ''),
        "AuthorName": get_val('AuthorName', 'AuthorName', '') or get_val('author_name', 'author_name', '') or get_val('in-author', 'in-author', ''),
        "IsFavorite": state.get('IsFavorite', False) if not isinstance(state.get('IsFavorite'), str) else state.get('IsFavorite').lower() == 'true',
        "IsUserCustom": True,
        "CharacterFlag": "1" if (basic.get('stat_type') == 'npc' or str(state.get('CharacterFlag', '')) == '1') else "0",
        "SpellLikeAbilities": sla_str,
        "Special Abilities": sa_str,
        "OriginalState": state,
        "_m_name": name.lower(),
        "_m_cr": str(cr).lower(),
        "_m_type": mtype.lower(),
        "_m_align": alignment.lower(),
        "_m_env": get_val('in-environment', 'Environment', '').lower(),
        "_m_source": "custom"
    }
    return rec
