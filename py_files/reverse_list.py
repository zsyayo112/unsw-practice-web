def reverse_list(L):
    if len(L) == 1:
        return L
    
    if not L:
        return 

    return [L[-1]] + reverse_list(L[:-1])


print(reverse_list([1, 2, 3, 4]))  #[4, 3, 2, 1]
print(reverse_list([5]))           # [5]
print(reverse_list([]))  