#!/usr/bin/env python3
"""
Скрипт валидации skills.
Проверяет структуру skill на соответствие требованиям Anthropic.

Использование:
    python validate_skill.py <путь_к_папке_skill>
    
Пример:
    python validate_skill.py .agent/skills/database-management
    
Примечание: Не требует внешних зависимостей (только стандартная библиотека Python).
"""

import os
import sys
import re
from pathlib import Path
from typing import List, Tuple, Optional, Dict, Any


def parse_simple_yaml(text: str) -> Optional[Dict[str, Any]]:
    """
    Простой парсер YAML для frontmatter.
    Поддерживает только базовые типы: строки, числа, списки.
    """
    result = {}
    current_key = None
    
    for line in text.strip().split('\n'):
        # Пропускаем пустые строки
        if not line.strip():
            continue
        
        # Проверяем на key: value
        match = re.match(r'^(\w+):\s*(.*)$', line)
        if match:
            key = match.group(1)
            value = match.group(2).strip()
            
            # Убираем кавычки если есть
            if value.startswith('"') and value.endswith('"'):
                value = value[1:-1]
            elif value.startswith("'") and value.endswith("'"):
                value = value[1:-1]
            
            # Если значение пустое — это может быть nested object
            if not value:
                result[key] = {}
                current_key = key
            else:
                result[key] = value
                current_key = None
        elif current_key and line.startswith('  '):
            # Nested значение
            nested_match = re.match(r'^  (\w+):\s*(.*)$', line)
            if nested_match:
                nested_key = nested_match.group(1)
                nested_value = nested_match.group(2).strip()
                if nested_value.startswith('"') and nested_value.endswith('"'):
                    nested_value = nested_value[1:-1]
                elif nested_value.startswith("'") and nested_value.endswith("'"):
                    nested_value = nested_value[1:-1]
                if isinstance(result.get(current_key), dict):
                    result[current_key][nested_key] = nested_value
    
    return result


class SkillValidator:
    """Валидатор структуры и содержимого skill."""
    
    def __init__(self, skill_path: str):
        self.skill_path = Path(skill_path)
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.info: List[str] = []
        
    def validate(self) -> bool:
        """Запуск всех проверок. Возвращает True если skill валиден."""
        self._check_folder_exists()
        self._check_folder_name()
        self._check_skill_md_exists()
        self._check_no_readme()
        
        if self.skill_path.exists() and (self.skill_path / "SKILL.md").exists():
            self._check_skill_md_content()
            
        return len(self.errors) == 0
    
    def _check_folder_exists(self):
        """Проверка существования папки."""
        if not self.skill_path.exists():
            self.errors.append(f"❌ Папка не существует: {self.skill_path}")
        elif not self.skill_path.is_dir():
            self.errors.append(f"❌ Путь не является папкой: {self.skill_path}")
    
    def _check_folder_name(self):
        """Проверка имени папки (kebab-case)."""
        folder_name = self.skill_path.name
        
        # Проверка kebab-case: только строчные буквы, цифры, дефисы
        if not re.match(r'^[a-z0-9]+(-[a-z0-9]+)*$', folder_name):
            self.errors.append(
                f"❌ Имя папки не в kebab-case: '{folder_name}'\n"
                f"   Правильно: только строчные буквы, цифры и дефисы"
            )
        else:
            self.info.append(f"✅ Имя папки корректно: {folder_name}")
    
    def _check_skill_md_exists(self):
        """Проверка существования SKILL.md."""
        skill_md = self.skill_path / "SKILL.md"
        
        if not skill_md.exists():
            # Проверяем альтернативные варианты
            alternatives = ["skill.md", "SKILL.MD", "Skill.md"]
            found = None
            for alt in alternatives:
                if (self.skill_path / alt).exists():
                    found = alt
                    break
            
            if found:
                self.errors.append(
                    f"❌ Файл назван неправильно: '{found}'\n"
                    f"   Должен быть: SKILL.md (регистр важен!)"
                )
            else:
                self.errors.append("❌ Файл SKILL.md не найден")
        else:
            self.info.append("✅ Файл SKILL.md существует")
    
    def _check_no_readme(self):
        """Проверка отсутствия README.md."""
        readme = self.skill_path / "README.md"
        if readme.exists():
            self.warnings.append(
                "⚠️ README.md не должен быть внутри папки skill\n"
                "   Перенеси документацию в SKILL.md или references/"
            )
    
    def _check_skill_md_content(self):
        """Проверка содержимого SKILL.md."""
        skill_md = self.skill_path / "SKILL.md"
        content = skill_md.read_text(encoding='utf-8')
        
        # Проверка YAML frontmatter
        self._check_frontmatter(content)
        
        # Проверка размера (< 5000 слов)
        self._check_word_count(content)
        
        # Проверка рекомендуемых секций
        self._check_recommended_sections(content)
        
        # Проверка целостности ссылок на references/
        self._check_reference_integrity(content)
        
        # Проверка наличия error handling
        self._check_error_handling(content)
    
    def _check_frontmatter(self, content: str):
        """Проверка YAML frontmatter."""
        # Проверка разделителей ---
        if not content.startswith('---'):
            self.errors.append(
                "❌ YAML frontmatter должен начинаться с ---\n"
                "   Сейчас: " + content[:20].replace('\n', '\\n') + "..."
            )
            return
        
        # Извлечение frontmatter
        parts = content.split('---', 2)
        if len(parts) < 3:
            self.errors.append(
                "❌ YAML frontmatter должен заканчиваться ---\n"
                "   Формат:\n   ---\n   name: skill-name\n   description: ...\n   ---"
            )
            return
        
        frontmatter_text = parts[1].strip()
        
        # Парсинг YAML
        try:
            frontmatter = parse_simple_yaml(frontmatter_text)
        except Exception as e:
            self.errors.append(f"❌ Ошибка парсинга YAML: {e}")
            return
        
        if not isinstance(frontmatter, dict):
            self.errors.append("❌ Frontmatter должен быть словарём")
            return
        
        # Проверка обязательных полей
        self._check_name_field(frontmatter)
        self._check_description_field(frontmatter, frontmatter_text)
        
        self.info.append("✅ YAML frontmatter корректен")
    
    def _check_name_field(self, frontmatter: dict):
        """Проверка поля name."""
        if 'name' not in frontmatter:
            self.errors.append("❌ Обязательное поле 'name' отсутствует")
            return
        
        name = frontmatter['name']
        
        # Проверка kebab-case
        if not re.match(r'^[a-z0-9]+(-[a-z0-9]+)*$', name):
            self.errors.append(
                f"❌ Поле 'name' не в kebab-case: '{name}'\n"
                f"   Правильно: my-skill-name"
            )
        
        # Проверка зарезервированных имён
        if name.startswith('claude') or name.startswith('anthropic'):
            self.errors.append(
                f"❌ Имя '{name}' использует зарезервированный префикс\n"
                f"   Нельзя начинать с 'claude' или 'anthropic'"
            )
        
        # Проверка соответствия имени папке
        if name != self.skill_path.name:
            self.warnings.append(
                f"⚠️ Имя skill '{name}' не совпадает с папкой '{self.skill_path.name}'\n"
                f"   Рекомендуется: name == имя папки"
            )
    
    def _check_description_field(self, frontmatter: dict, raw_text: str):
        """Проверка поля description."""
        if 'description' not in frontmatter:
            self.errors.append("❌ Обязательное поле 'description' отсутствует")
            return
        
        desc = frontmatter['description']
        
        # Проверка длины
        if len(desc) > 1024:
            self.errors.append(
                f"❌ Description слишком длинный: {len(desc)} символов\n"
                f"   Максимум: 1024 символов"
            )
        
        # Проверка XML тегов
        if '<' in desc or '>' in desc:
            self.errors.append(
                "❌ Description содержит запрещённые символы < или >\n"
                "   XML теги запрещены в YAML frontmatter"
            )
        
        # Проверка на расплывчатость
        vague_patterns = [
            r'^helps?\s+with',
            r'^does?\s+things?',
            r'^processes?\s+data',
        ]
        for pattern in vague_patterns:
            if re.search(pattern, desc.lower()):
                self.warnings.append(
                    "⚠️ Description слишком расплывчатый\n"
                    "   Добавь конкретные триггеры: когда использовать skill"
                )
                break
        
        # Проверка наличия триггеров
        trigger_keywords = ['when', 'use for', 'triggers', 'используй', 'когда', 'триггер']
        has_trigger = any(kw in desc.lower() for kw in trigger_keywords)
        if not has_trigger:
            self.warnings.append(
                "⚠️ Description не содержит явных триггеров\n"
                "   Рекомендуется: 'Используй когда...' / 'Триггеры: ...'"
            )
    
    def _check_word_count(self, content: str):
        """Проверка размера SKILL.md (рекомендуется < 5000 слов)."""
        word_count = len(content.split())
        if word_count > 5000:
            self.warnings.append(
                f"⚠️ SKILL.md слишком большой: {word_count} слов\n"
                f"   Рекомендуется: < 5000 слов. Детали вынеси в references/"
            )
        else:
            self.info.append(f"✅ Размер SKILL.md: {word_count} слов (< 5000)")
    
    def _check_recommended_sections(self, content: str):
        """Проверка наличия рекомендуемых секций."""
        content_lower = content.lower()
        
        # Проверка Troubleshooting
        if 'troubleshooting' not in content_lower:
            self.warnings.append(
                "⚠️ Секция 'Troubleshooting' не найдена\n"
                "   Рекомендуется: добавить секцию с решениями частых проблем"
            )
        else:
            self.info.append("✅ Секция Troubleshooting найдена")
        
        # Проверка Examples/Примеры
        has_examples = ('## examples' in content_lower or 
                       '## примеры' in content_lower or
                       '## пример' in content_lower)
        if not has_examples:
            self.warnings.append(
                "⚠️ Секция 'Examples/Примеры' не найдена\n"
                "   Рекомендуется: добавить конкретные примеры использования"
            )
        else:
            self.info.append("✅ Секция Examples/Примеры найдена")
    
    def _check_reference_integrity(self, content: str):
        """Проверка целостности ссылок на references/."""
        references_dir = self.skill_path / "references"
        
        if references_dir.exists() and references_dir.is_dir():
            ref_files = list(references_dir.iterdir())
            if not ref_files:
                self.warnings.append(
                    "⚠️ Папка references/ существует, но пуста\n"
                    "   Добавь справочные материалы или удали пустую папку"
                )
            else:
                self.info.append(f"✅ Папка references/: {len(ref_files)} файлов")
            
            # Проверяем упоминания references/ в контенте
            ref_mentions = re.findall(r'references/([\w-]+\.\w+)', content)
            for ref_name in ref_mentions:
                ref_path = references_dir / ref_name
                if not ref_path.exists():
                    self.warnings.append(
                        f"⚠️ Ссылка на несуществующий файл: references/{ref_name}\n"
                        f"   Создай файл или исправь ссылку"
                    )
    
    def _check_error_handling(self, content: str):
        """Проверка наличия error handling паттернов."""
        content_lower = content.lower()
        error_keywords = [
            'error', 'ошибк', 'fallback', 'если не',
            'fail', 'проблем', 'решение', 'fix'
        ]
        
        has_error_handling = any(kw in content_lower for kw in error_keywords)
        if not has_error_handling:
            self.warnings.append(
                "⚠️ Не найдены паттерны обработки ошибок\n"
                "   Рекомендуется: описать как обрабатывать частые ошибки"
            )
        else:
            self.info.append("✅ Паттерны обработки ошибок найдены")
    
    def print_report(self):
        """Вывод отчёта о валидации."""
        print(f"\n{'='*60}")
        print(f"Валидация skill: {self.skill_path}")
        print(f"{'='*60}\n")
        
        if self.errors:
            print("ОШИБКИ (необходимо исправить):")
            for error in self.errors:
                print(f"  {error}\n")
        
        if self.warnings:
            print("ПРЕДУПРЕЖДЕНИЯ (рекомендуется исправить):")
            for warning in self.warnings:
                print(f"  {warning}\n")
        
        if self.info:
            print("ИНФОРМАЦИЯ:")
            for info in self.info:
                print(f"  {info}")
        
        print(f"\n{'='*60}")
        if not self.errors:
            print("✅ SKILL ВАЛИДЕН")
        else:
            print(f"❌ SKILL НЕВАЛИДЕН ({len(self.errors)} ошибок)")
        print(f"{'='*60}\n")


def main():
    if len(sys.argv) < 2:
        print("Использование: python validate_skill.py <путь_к_папке_skill>")
        print("Пример: python validate_skill.py .agent/skills/database-management")
        sys.exit(1)
    
    skill_path = sys.argv[1]
    validator = SkillValidator(skill_path)
    is_valid = validator.validate()
    validator.print_report()
    
    sys.exit(0 if is_valid else 1)


if __name__ == "__main__":
    main()
