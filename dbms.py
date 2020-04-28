schema=input("Enter the schema ")
sno=len(schema)
fdno=int(input("Enter the number of dependences "))
l=[]
for i in range(fdno):
    print()
    left=input("Enter left attribute ")
    right=input("Enter right attribute ")
    l.append((left,right))
print()
attr=input("Enter the attribute whose closure to be find ")
k=attr
for p,q in l:
    count=0
    for w in p:
        if w in k:
            count+=1
    if(count==len(p)):
        k+=q
k=set(k)
result=""
for i in k:
    result+=i
print(result)             
