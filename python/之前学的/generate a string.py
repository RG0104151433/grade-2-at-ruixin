text=input()
if len(text)<2 :
    print('Empty String')
else :
    ans=text[0:2]+text[-2:]
    print(ans)