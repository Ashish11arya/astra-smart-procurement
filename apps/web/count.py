content = open(r'd:\Astra\apps\web\rewrite_procurement_v2.py', 'r', encoding='utf-8').read()
code = content.split('new_jsx = """')[1].split('"""')[0]
print('(', code.count('('))
print(')', code.count(')'))
print('{', code.count('{'))
print('}', code.count('}'))
print('<', code.count('<'))
print('>', code.count('>'))
