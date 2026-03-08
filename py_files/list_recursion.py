# 计算列表所有元素的和

def sum_elements_all_list(L):
    if not L:
        return 0
    
    return sum_elements_all_list(L[1:]) + L[0]



print(sum_elements_all_list([1,2,3,4,5,6]))