"""Compara o MusicXML do OMR com o gabarito, nota a nota, por distância de edição.

Sequência: todas as notas e pausas da 1ª parte, em ordem de pauta, compasso e tempo.
- "completo": (altura MIDI ou pausa, duração em semínimas)
- "altura":   só a altura MIDI (pausas fora)
Acerto = 1 - distância / tamanho do gabarito.

Uso: python compare.py <gabarito.xml> <omr.mxl|xml>
"""
import sys
import zipfile
import xml.etree.ElementTree as ET
from fractions import Fraction

STEP = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def load(path):
    if path.endswith(".mxl"):
        with zipfile.ZipFile(path) as z:
            container = ET.fromstring(z.read("META-INF/container.xml"))
            root_file = container.find(".//rootfile").get("full-path")
            return ET.fromstring(z.read(root_file))
    return ET.parse(path).getroot()


def strip(root):
    for el in root.iter():
        if "}" in el.tag:
            el.tag = el.tag.split("}", 1)[1]
    return root


def events(path):
    root = strip(load(path))
    part = root.find("part")
    out = []  # (staff, measure, onset, voice, pitch, dur)
    divisions = 1
    for m_index, measure in enumerate(part.findall("measure")):
        t = Fraction(0)
        last_onset = Fraction(0)
        for el in measure:
            if el.tag == "attributes" and el.find("divisions") is not None:
                divisions = int(el.find("divisions").text)
            elif el.tag == "backup":
                t -= Fraction(int(el.find("duration").text), divisions)
            elif el.tag == "forward":
                t += Fraction(int(el.find("duration").text), divisions)
            elif el.tag == "note":
                if el.find("grace") is not None:
                    continue
                dur_el = el.find("duration")
                dur = Fraction(int(dur_el.text), divisions) if dur_el is not None else Fraction(0)
                chord = el.find("chord") is not None
                onset = last_onset if chord else t
                if el.find("rest") is not None:
                    pitch = "r"
                else:
                    p = el.find("pitch")
                    alter = int(float(p.findtext("alter", "0")))
                    pitch = 12 * (int(p.findtext("octave")) + 1) + STEP[p.findtext("step")] + alter
                staff = int(el.findtext("staff", "1"))
                voice = el.findtext("voice", "1")
                out.append((staff, m_index, onset, voice, pitch, dur))
                if not chord:
                    last_onset = t
                    t += dur
    # Ordem estável: pauta, compasso, tempo, altura. Ignora numeração de voz.
    out.sort(key=lambda e: (e[0], e[1], e[2], -1 if e[4] == "r" else e[4]))
    return out


def distance(a, b):
    prev = list(range(len(b) + 1))
    for i, x in enumerate(a, 1):
        cur = [i] + [0] * len(b)
        for j, y in enumerate(b, 1):
            cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (x != y))
        prev = cur
    return prev[-1]


def score(ref, got):
    if not ref:
        return 0.0
    return max(0.0, 1 - distance(ref, got) / len(ref))


ref, got = events(sys.argv[1]), events(sys.argv[2])
full = score([(e[4], e[5]) for e in ref], [(e[4], e[5]) for e in got])
pitch = score([e[4] for e in ref if e[4] != "r"], [e[4] for e in got if e[4] != "r"])
measures_ref = len({e[1] for e in ref})
measures_got = len({e[1] for e in got})
print(f"{full:.4f}\t{pitch:.4f}\t{len(ref)}\t{len(got)}\t{measures_ref}\t{measures_got}")
