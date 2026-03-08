def find_max(L):
    if len(L) == 1:
        return L[0]
    
    max_val = L[0]

    return max(max_val,find_max(L[1:]))



print(find_max([1,3,22,5]))